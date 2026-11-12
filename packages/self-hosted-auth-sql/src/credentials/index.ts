import { createFeature } from "@webiny/feature/api";
import { SqlCredentialsTable } from "./CredentialsTable.js";
import { SqlGetCredentialByEmail } from "./SqlGetCredentialByEmail.js";
import { SqlGetCredentialByUserId } from "./SqlGetCredentialByUserId.js";
import { SqlSaveCredential } from "./SqlSaveCredential.js";
import { SqlDeleteCredential } from "./SqlDeleteCredential.js";

export const CredentialsSqlFeature = createFeature({
    name: "SelfHostedAuthCredentialsSql",
    register(container) {
        container.register(SqlCredentialsTable);

        container.register(SqlGetCredentialByEmail);
        container.register(SqlGetCredentialByUserId);
        container.register(SqlSaveCredential);
        container.register(SqlDeleteCredential);
    }
});
