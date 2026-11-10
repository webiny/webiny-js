import { setStorageOps } from "@webiny/api-core/testing/environment.js";
import { registerAcoPgStorageOperations } from "../../src/index.js";

setStorageOps("aco", () => {
    return {
        storageOperations: {},
        plugins: [registerAcoPgStorageOperations()]
    };
});
