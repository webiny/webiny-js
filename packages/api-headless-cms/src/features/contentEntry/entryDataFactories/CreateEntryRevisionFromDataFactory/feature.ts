import { createFeature } from "@webiny/feature/api";
import { CreateEntryRevisionFromDataFactory } from "./CreateEntryRevisionFromDataFactory.js";

export const CreateEntryRevisionFromDataFactoryFeature = createFeature({
    name: "CreateEntryRevisionFromDataFactory",
    register(container) {
        container.register(CreateEntryRevisionFromDataFactory).inSingletonScope();
    }
});
