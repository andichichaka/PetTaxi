import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class S3ImageStorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const bucketName = process.env.S3_BUCKET_NAME;

    try {
      
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);

      return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Could not upload file to S3');
    }
  }

  async deleteFile(key: string): Promise<void> {
    const bucketName = process.env.S3_BUCKET_NAME;

    try {
      const params = {
        Bucket: bucketName,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new Error('Could not delete file from S3');
    }
  }

  async replaceFile(oldKey: string | null, file: Express.Multer.File, newKey: string): Promise<string> {
    if (oldKey) {
      await this.deleteFile(oldKey);
    }

    return this.uploadFile(file, newKey);
  }
}
