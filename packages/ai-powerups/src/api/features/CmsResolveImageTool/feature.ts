import { createFeature } from "@webiny/feature/api";
import { CmsResolveImageTool } from "./CmsResolveImageTool.js";

export const CmsResolveImageToolFeature = createFeature({
    name: "AiPowerUps/CmsResolveImageTool",
    register(container) {
        container.register(CmsResolveImageTool);
    }
});
