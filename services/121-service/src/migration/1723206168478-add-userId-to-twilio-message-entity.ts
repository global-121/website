import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserIdToTwilioMessageEntity1723206168478
  implements MigrationInterface
{
  name = 'AddUserIdToTwilioMessageEntity1723206168478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD "userId" integer`,
    );

    await queryRunner.query(
      `UPDATE "121-service"."twilio_message" SET "userId" = 1 WHERE "userId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" ADD CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf" FOREIGN KEY ("userId") REFERENCES "121-service"."user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP CONSTRAINT "FK_9c1038f92cd1b99b1babcc4fecf"`,
    );

    await queryRunner.query(
      `ALTER TABLE "121-service"."twilio_message" DROP COLUMN "userId"`,
    );
  }
}
