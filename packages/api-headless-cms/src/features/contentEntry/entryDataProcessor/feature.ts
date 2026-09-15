import { createFeature } from "@webiny/feature/api";
import { EntryDataProcessor } from "./EntryDataProcessor.js";

export const EntryDataProcessorFeature = createFeature({
    name: "EntryDataProcessor",
    register(container) {
        container.register(EntryDataProcessor).inSingletonScope();
    }
});
