import { createFeature } from "@webiny/feature/api";
import { CmsLocatorResolver } from "./CmsLocatorResolver.js";

export const CmsLocatorResolverFeature = createFeature({
    name: "Collaboration/CmsLocatorResolver",
    register(container) {
        container.register(CmsLocatorResolver).inSingletonScope();
    }
});
