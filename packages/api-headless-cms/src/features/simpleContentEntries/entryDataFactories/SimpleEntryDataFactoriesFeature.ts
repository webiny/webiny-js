import { createFeature } from "@webiny/feature/api";
import { CreateSimpleEntryDataFactoryFeature } from "./createSimpleEntryData/feature.js";

export const SimpleEntryDataFactoriesFeature = createFeature({
    name: "SimpleEntryDataFactories",
    register(container) {
        CreateSimpleEntryDataFactoryFeature.register(container);
    }
});
