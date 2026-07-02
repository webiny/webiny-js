import { createFeature } from "@webiny/feature/admin";
import { CmsPlaygroundTabs } from "./CmsPlaygroundTabs.js";

export const CmsPlaygroundTabsFeature = createFeature({
    name: "CmsPlaygroundTabs",
    register(container) {
        container.register(CmsPlaygroundTabs);
    },
    resolve() {
        return {};
    }
});
