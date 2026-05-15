import { createFeature } from "@webiny/feature/api";
import { CompressionHandler } from "./CompressionHandler.js";
import { GzipCompression } from "./GzipCompression.js";
import { JsonpackCompression } from "./JsonpackCompression.js";

export const CompressionFeature = createFeature({
    name: "Api/CompressionFeature",
    register: container => {
        container.register(GzipCompression).inSingletonScope();
        container.register(JsonpackCompression).inSingletonScope();
        container.register(CompressionHandler).inSingletonScope();
    }
});
