import { Module, Global } from '@nestjs/common';
import { S3ImageStorageService } from './s3-image-storage.service';
import { PostsModule } from 'src/posts/posts.module';

@Global()
@Module({
    imports: [PostsModule],
    providers: [S3ImageStorageService],
    exports: [S3ImageStorageService],
})
export class ImageStorageModule {}
