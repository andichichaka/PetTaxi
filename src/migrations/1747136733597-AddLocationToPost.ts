import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationToPost1747136733597 implements MigrationInterface {
    name = 'AddLocationToPost1747136733597'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" ADD "location" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "location"`);
    }

}
