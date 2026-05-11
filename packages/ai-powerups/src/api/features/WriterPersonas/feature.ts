import { createFeature } from "@webiny/feature/api";
import WriterPersonasHandler from "./WriterPersonasHandler.js";

export const WriterPersonasFeature = createFeature({
    name: "AiPowerUpsWriterPersonas",
    register(container) {
        container.register(WriterPersonasHandler);
    }
});
