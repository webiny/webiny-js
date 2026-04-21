import { createFeature } from "@webiny/feature/admin";
import { ResolveImageTool } from "./ResolveImageTool.js";

export const ResolveImageToolFeature = createFeature({
    name: "Tools/ResolveImageTool",
    register(container) {
        container.register(ResolveImageTool);
    }
});
