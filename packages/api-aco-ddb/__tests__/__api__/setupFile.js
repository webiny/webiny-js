import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { setStorageOps } from "@webiny/project-utils/testing/environment/index.js";
import { registerAcoDdbStorageOperations } from "../../src/index.js";

setStorageOps("aco", () => {
    const documentClient = getDocumentClient();

    return {
        storageOperations: {},
        plugins: [registerAcoDdbStorageOperations({ documentClient })]
    };
});
