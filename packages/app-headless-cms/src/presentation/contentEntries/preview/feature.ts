import { createFeature } from "@webiny/feature/admin";
import { LivePreviewPresenter as Abstraction } from "./abstractions.js";
import { LivePreviewPresenter } from "./LivePreviewPresenter.js";

export const LivePreviewFeature = createFeature({
    name: "CmsContentEntries/LivePreview",
    register(container) {
        container.register(LivePreviewPresenter).inSingletonScope();
    },
    resolve(container) {
        return {
            presenter: container.resolve(Abstraction)
        };
    }
});
