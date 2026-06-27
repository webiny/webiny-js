import { createFeature } from "@webiny/feature/admin";
import { ClipboardService } from "./ClipboardService.js";
import { Clipboard as ClipboardAbstraction } from "./abstractions.js";

export const ClipboardFeature = createFeature({
    name: "Clipboard",
    register(container) {
        container.register(ClipboardService).inSingletonScope();
    },
    resolve(container) {
        return {
            clipboard: container.resolve(ClipboardAbstraction)
        };
    }
});
