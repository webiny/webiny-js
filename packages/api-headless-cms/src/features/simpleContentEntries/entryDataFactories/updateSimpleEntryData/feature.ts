import { createFeature } from "@webiny/feature/api";
import { UpdateSimpleEntryDataFactory } from "./UpdateSimpleEntryDataFactory.js";

export const UpdateSimpleEntryDataFactoryFeature = createFeature({
    name: "UpdateSimpleEntryDataFactory",
    register(container) {
        container.register(UpdateSimpleEntryDataFactory).inSingletonScope();
    }
});
