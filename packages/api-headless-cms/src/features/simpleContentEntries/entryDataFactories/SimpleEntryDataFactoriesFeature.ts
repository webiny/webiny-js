import { createFeature } from "@webiny/feature/api";
import { CreateSimpleEntryDataFactoryFeature } from "./createSimpleEntryData/feature.js";
import { UpdateSimpleEntryDataFactoryFeature } from "./updateSimpleEntryData/feature.js";

export const SimpleEntryDataFactoriesFeature = createFeature({
    name: "SimpleEntryDataFactories",
    register(container) {
        CreateSimpleEntryDataFactoryFeature.register(container);
        UpdateSimpleEntryDataFactoryFeature.register(container);
    }
});
