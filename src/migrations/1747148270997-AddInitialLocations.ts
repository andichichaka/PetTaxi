import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInitialLocations1747148270997 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          INSERT INTO location (name) VALUES
          ('Sofia'),
          ('Plovdiv'),
          ('Varna'),
          ('Burgas'),
          ('Ruse'),
          ('Stara Zagora'),
          ('Pleven'),
          ('Sliven'),
          ('Dobrich'),
          ('Shumen');
        `);
      }

      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          DELETE FROM location WHERE name IN (
            'Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse',
            'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen'
          );
        `);
      }

}
