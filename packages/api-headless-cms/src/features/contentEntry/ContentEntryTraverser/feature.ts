import { createFeature } from "@webiny/feature/api";
import { ContentEntryTraverserProvider } from "./ContentEntryTraverserProvider.js";

export const ContentEntryTraverserFeature = createFeature({
    name: "ContentEntryTraverser",
    register(container) {
        container.register(ContentEntryTraverserProvider);
    }
});
