import { createFeature } from "@webiny/feature/api";
import ReaderPersonasHandler from "./ReaderPersonasHandler.js";

export const ReaderPersonasFeature = createFeature({
    name: "AiPowerUpsReaderPersonas",
    register(container) {
        container.register(ReaderPersonasHandler);
    }
});
