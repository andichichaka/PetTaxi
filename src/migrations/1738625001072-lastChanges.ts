import { MigrationInterface, QueryRunner } from "typeorm";

export class LastChanges1738625001072 implements MigrationInterface {
    name = 'LastChanges1738625001072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."booking_animaltype_enum" AS ENUM('cat', 'dog', 'both')`);
        await queryRunner.query(`CREATE TYPE "public"."booking_animalsize_enum" AS ENUM('mini (0-5kg)', 'small (5-10kg)', 'medium (10-15kg)', 'large (15-25kg)', 'other')`);
        await queryRunner.query(`CREATE TABLE "booking" ("id" SERIAL NOT NULL, "animalType" "public"."booking_animaltype_enum" NOT NULL, "animalSize" "public"."booking_animalsize_enum" NOT NULL, "bookingDates" text, "price" integer NOT NULL, "notes" text, "isApproved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "serviceId" integer, "userId" integer, CONSTRAINT "PK_49171efc69702ed84c812f33540" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."service_servicetype_enum" AS ENUM('daily walking', 'weekly walking', 'daily sitting', 'weekly sitting', 'other')`);
        await queryRunner.query(`CREATE TABLE "service" ("id" SERIAL NOT NULL, "serviceType" "public"."service_servicetype_enum" NOT NULL, "price" numeric(10,2) NOT NULL, "unavailableDates" text NOT NULL DEFAULT '', "postId" integer, CONSTRAINT "PK_85a21558c006647cd76fdce044b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "review" ("id" SERIAL NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, "postId" integer, CONSTRAINT "PK_2e4299a343a81574217255c00ca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."post_animaltype_enum" AS ENUM('cat', 'dog', 'both')`);
        await queryRunner.query(`CREATE TYPE "public"."post_animalsizes_enum" AS ENUM('mini (0-5kg)', 'small (5-10kg)', 'medium (10-15kg)', 'large (15-25kg)', 'other')`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "imagesUrl" text DEFAULT '', "description" text NOT NULL, "animalType" "public"."post_animaltype_enum" NOT NULL, "animalSizes" "public"."post_animalsizes_enum" array NOT NULL DEFAULT '{}', "userId" integer, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "description" text, "profilePic" character varying, "isEmailVerified" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "code" ("id" SERIAL NOT NULL, "code" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "expireAt" TIMESTAMP NOT NULL, "userId" integer, CONSTRAINT "PK_367e70f79a9106b8e802e1a9825" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "FK_e812cafb996fae4e9636ffe294f" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking" ADD CONSTRAINT "FK_336b3f4a235460dc93645fbf222" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service" ADD CONSTRAINT "FK_aa87a620eee617ffafeb54292b1" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_1337f93918c70837d3cea105d39" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_6d29b67dde3b5f3629777a6d05f" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_5c1cf55c308037b5aca1038a131" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "code" ADD CONSTRAINT "FK_76c04a353b3639752b096e75ec4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "code" DROP CONSTRAINT "FK_76c04a353b3639752b096e75ec4"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_5c1cf55c308037b5aca1038a131"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_6d29b67dde3b5f3629777a6d05f"`);
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1337f93918c70837d3cea105d39"`);
        await queryRunner.query(`ALTER TABLE "service" DROP CONSTRAINT "FK_aa87a620eee617ffafeb54292b1"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_336b3f4a235460dc93645fbf222"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP CONSTRAINT "FK_e812cafb996fae4e9636ffe294f"`);
        await queryRunner.query(`DROP TABLE "code"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TYPE "public"."post_animalsizes_enum"`);
        await queryRunner.query(`DROP TYPE "public"."post_animaltype_enum"`);
        await queryRunner.query(`DROP TABLE "review"`);
        await queryRunner.query(`DROP TABLE "service"`);
        await queryRunner.query(`DROP TYPE "public"."service_servicetype_enum"`);
        await queryRunner.query(`DROP TABLE "booking"`);
        await queryRunner.query(`DROP TYPE "public"."booking_animalsize_enum"`);
        await queryRunner.query(`DROP TYPE "public"."booking_animaltype_enum"`);
    }

}
