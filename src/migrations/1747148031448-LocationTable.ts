import { MigrationInterface, QueryRunner } from "typeorm";

export class LocationTable1747148031448 implements MigrationInterface {
    name = 'LocationTable1747148031448'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" RENAME COLUMN "location" TO "locationId"`);
        await queryRunner.query(`CREATE TABLE "location" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_f0336eb8ccdf8306e270d400cf0" UNIQUE ("name"), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "locationId" integer`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_ba07795b0c8471bfdf0cb687eda" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_ba07795b0c8471bfdf0cb687eda"`);
        await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "locationId"`);
        await queryRunner.query(`ALTER TABLE "post" ADD "locationId" character varying`);
        await queryRunner.query(`DROP TABLE "location"`);
        await queryRunner.query(`ALTER TABLE "post" RENAME COLUMN "locationId" TO "location"`);
    }

}
