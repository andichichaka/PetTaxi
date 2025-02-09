import { MigrationInterface, QueryRunner } from "typeorm";

export class EagerTrue1738671664575 implements MigrationInterface {
    name = 'EagerTrue1738671664575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1337f93918c70837d3cea105d39"`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_1337f93918c70837d3cea105d39" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "review" DROP CONSTRAINT "FK_1337f93918c70837d3cea105d39"`);
        await queryRunner.query(`ALTER TABLE "review" ADD CONSTRAINT "FK_1337f93918c70837d3cea105d39" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
