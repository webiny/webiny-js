import { createFeature } from "@webiny/feature/api";
import { SqlPasswordResetCodesTable } from "./PasswordResetCodesTable.js";
import { SqlSavePasswordResetCode } from "./SqlSavePasswordResetCode.js";
import { SqlListLivePasswordResetCodes } from "./SqlListLivePasswordResetCodes.js";
import { SqlCountPasswordResetCodes } from "./SqlCountPasswordResetCodes.js";
import { SqlSetPasswordResetCodeHash } from "./SqlSetPasswordResetCodeHash.js";
import { SqlIncrementPasswordResetCodeAttempts } from "./SqlIncrementPasswordResetCodeAttempts.js";
import { SqlMarkPasswordResetCodesUsed } from "./SqlMarkPasswordResetCodesUsed.js";
import { SqlDeleteExpiredPasswordResetCodes } from "./SqlDeleteExpiredPasswordResetCodes.js";

export const PasswordResetCodesSqlFeature = createFeature({
    name: "SelfHostedAuthPasswordResetCodesSql",
    register(container) {
        container.register(SqlPasswordResetCodesTable);

        container.register(SqlSavePasswordResetCode);
        container.register(SqlListLivePasswordResetCodes);
        container.register(SqlCountPasswordResetCodes);
        container.register(SqlSetPasswordResetCodeHash);
        container.register(SqlIncrementPasswordResetCodeAttempts);
        container.register(SqlMarkPasswordResetCodesUsed);
        container.register(SqlDeleteExpiredPasswordResetCodes);
    }
});
