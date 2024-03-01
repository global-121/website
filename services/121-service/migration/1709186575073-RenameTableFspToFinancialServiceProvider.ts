import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTableFspToFinancialServiceProvider1709186575073
  implements MigrationInterface
{
  name = 'RenameTableFspToFinancialServiceProvider1709186575073';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraints that reference the old table (queries generated by TypeORM)
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" DROP CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" DROP CONSTRAINT "FK_16ea24d04150003a29a346ade61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" DROP CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" DROP CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345"`,
    );
    // TODO: Also on table program_financial_service_providers_fsp? (see create FK constraints below)

    // Rename table fsp to financial_service_provider
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp" RENAME TO "financial_service_provider"`,
    );
    // Also rename the generated cross table by TypeORM: program_financial_service_providers_fsp to program_financial_service_providers_financial_service_provider
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_fsp" RENAME TO "program_financial_service_providers_financial_service_provider"`,
    );
    // In table program_financial_service_providers_fsp rename fspId to financialServiceProviderId
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" RENAME COLUMN "fspId" TO "financialServiceProviderId"`,
    );

    // Create FK constraints to reference the new table (queries generated by TypeORM, but edited)
    await queryRunner.query(
      `ALTER TABLE "121-service"."transaction" ADD CONSTRAINT "FK_ba98ea5ca43ebe54f60c5aaabec" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_fsp_configuration" ADD CONSTRAINT "FK_16ea24d04150003a29a346ade61" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."fsp_attribute" ADD CONSTRAINT "FK_16ab80e3d29fab4db86caa37b3b" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."registration" ADD CONSTRAINT "FK_9e5a5ef99940e591cad5b25a345" FOREIGN KEY ("fspId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_9963d8ef06f3358d2bc7fa6a4dd" FOREIGN KEY ("programId") REFERENCES "121-service"."program"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "121-service"."program_financial_service_providers_financial_service_provider" ADD CONSTRAINT "FK_789ae7926495e63ba39ef47b8c2" FOREIGN KEY ("financialServiceProviderId") REFERENCES "121-service"."financial_service_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Re-create (update) the view registration_view (queries generated by TypeORM)
    await queryRunner.query(
      `CREATE OR REPLACE VIEW "121-service"."registration_view" AS SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",'yyyy-mm-dd') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || ': ' || "message"."status",'no messages yet') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC`,
    );
    await queryRunner.query(
      `INSERT INTO "121-service"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        '121-service',
        'VIEW',
        'registration_view',
        'SELECT "registration"."id" AS "id", "registration"."created" AS "registrationCreated", "registration"."programId" AS "programId", "registration"."registrationStatus" AS "status", "registration"."referenceId" AS "referenceId", "registration"."phoneNumber" AS "phoneNumber", "registration"."preferredLanguage" AS "preferredLanguage", "registration"."inclusionScore" AS "inclusionScore", "registration"."paymentAmountMultiplier" AS "paymentAmountMultiplier", "registration"."maxPayments" AS "maxPayments", "registration"."paymentCount" AS "paymentCount", "registration"."scope" AS "scope", "fsp"."fsp" AS "financialServiceProvider", "fsp"."fspDisplayNamePortal" AS "fspDisplayNamePortal", CAST(CONCAT(\'PA #\',registration."registrationProgramId") as VARCHAR) AS "personAffectedSequence", registration."registrationProgramId" AS "registrationProgramId", TO_CHAR("registration"."created",\'yyyy-mm-dd\') AS "registrationCreatedDate", "registration"."maxPayments" - "registration"."paymentCount" AS "paymentCountRemaining", COALESCE("message"."type" || \': \' || "message"."status",\'no messages yet\') AS "lastMessageStatus" FROM "121-service"."registration" "registration" LEFT JOIN "121-service"."financial_service_provider" "fsp" ON "fsp"."id"="registration"."fspId"  LEFT JOIN "121-service"."latest_message" "latestMessage" ON "latestMessage"."registrationId"="registration"."id"  LEFT JOIN "121-service"."twilio_message" "message" ON "message"."id"="latestMessage"."messageId" ORDER BY "registration"."registrationProgramId" ASC',
      ],
    );

    /* Unused queries generated by TypeORM
        await queryRunner.query(`CREATE TABLE "121-service"."financial_service_provider" ("id" SERIAL NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT now(), "updated" TIMESTAMP NOT NULL DEFAULT now(), "fsp" character varying NOT NULL, "fspDisplayNamePaApp" json, "fspDisplayNamePortal" character varying, "integrationType" character varying NOT NULL DEFAULT 'api', "hasReconciliation" boolean NOT NULL DEFAULT false, "notifyOnTransaction" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_d262a3ff3eeab86e0f51742d3f9" UNIQUE ("fsp"), CONSTRAINT "PK_af433cae58e5eb3e53a45e4ee9c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a0f41ec6505ba4bd1c8e99c6e5" ON "121-service"."financial_service_provider" ("created") `);
        await queryRunner.query(`CREATE TABLE "121-service"."program_financial_service_providers_financial_service_provider" ("programId" integer NOT NULL, "financialServiceProviderId" integer NOT NULL, CONSTRAINT "PK_82446e48faf54f2fb2e870f3566" PRIMARY KEY ("programId", "financialServiceProviderId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9963d8ef06f3358d2bc7fa6a4d" ON "121-service"."program_financial_service_providers_financial_service_provider" ("programId") `);
        await queryRunner.query(`CREATE INDEX "IDX_789ae7926495e63ba39ef47b8c" ON "121-service"."program_financial_service_providers_financial_service_provider" ("financialServiceProviderId") `);
        */
  }

  public async down(): Promise<void> {
    console.log('Down migration not implemented');
    // Down migration not implemented because it's not needed
  }
}
