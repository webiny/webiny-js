import { createFeature } from "@webiny/feature/api/index.js";
import { EntryWriteOperations } from "./EntryWriteOperations.js";
import { EntrySearchOperations } from "./EntrySearchOperations.js";

export const EntryOperationsFeature = createFeature({
    name: "cms.pgOs.entryOperations",
    register: container => {
        container.register(EntryWriteOperations);
        container.register(EntrySearchOperations);
    }
});
