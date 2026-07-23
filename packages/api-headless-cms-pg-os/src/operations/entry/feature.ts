import { createFeature } from "@webiny/feature/api/index.js";
import { EntryWriteOperations } from "./EntryWriteOperations.js";

export const EntryWriteOperationsFeature = createFeature({
    name: "cms.pgOs.entryWriteOperations",
    register: container => {
        container.register(EntryWriteOperations);
    }
});
