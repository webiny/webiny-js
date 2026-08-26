import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { registerAcoDdbStorageOperations } from "../../src/index.js";

setStorageOps("aco", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: {},
        plugins: [registerAcoDdbStorageOperations({ documentClient })]
    };
});
