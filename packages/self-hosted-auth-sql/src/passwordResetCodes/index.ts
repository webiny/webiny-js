import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { TableManager } from "@webiny/api-core-sql/TableManager.js";
import { PasswordResetCodesTable } from "./PasswordResetCodesTable.js";
import { KnexPasswordResetCodesTable } from "./PasswordResetCodesTable.js";
import { SqlSavePasswordResetCode } from "./SqlSavePasswordResetCode.js";
import { SqlListLivePasswordResetCodes } from "./SqlListLivePasswordResetCodes.js";
import { SqlCountPasswordResetCodes } from "./SqlCountPasswordResetCodes.js";
import { SqlIncrementPasswordResetCodeAttempts } from "./SqlIncrementPasswordResetCodeAttempts.js";
import { SqlMarkPasswordResetCodesUsed } from "./SqlMarkPasswordResetCodesUsed.js";
import { SqlDeleteExpiredPasswordResetCodes } from "./SqlDeleteExpiredPasswordResetCodes.js";

export interface PasswordResetCodesSqlConfig {
    knex: Knex;
    tableManager: TableManager;
}

export const PasswordResetCodesSqlFeature = createFeature<PasswordResetCodesSqlConfig>({
    name: "SelfHostedAuthPasswordResetCodesSql",
    register(container, { knex, tableManager }) {
        container.registerInstance(
            PasswordResetCodesTable,
            new KnexPasswordResetCodesTable(knex, tableManager)
        );

        container.register(SqlSavePasswordResetCode);
        container.register(SqlListLivePasswordResetCodes);
        container.register(SqlCountPasswordResetCodes);
        container.register(SqlIncrementPasswordResetCodeAttempts);
        container.register(SqlMarkPasswordResetCodesUsed);
        container.register(SqlDeleteExpiredPasswordResetCodes);
    }
});
