import { createFeature } from "@webiny/app/shared/di/createFeature.js";
import { CmsPlaygroundTabs } from "./CmsPlaygroundTabs.js";

export const CmsPlaygroundTabsFeature = createFeature({
    name: "CmsPlaygroundTabs",
    register(container) {
        container.registerDecorator(CmsPlaygroundTabs);
    },
    resolve() {
        return {};
    }
});
