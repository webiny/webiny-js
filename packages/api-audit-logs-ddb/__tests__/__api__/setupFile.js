import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { registerAuditLogsDdbStorageOperations } from "../../src/index.js";

setStorageOps("auditLogs", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: {},
        plugins: [registerAuditLogsDdbStorageOperations({ documentClient })]
    };
});
