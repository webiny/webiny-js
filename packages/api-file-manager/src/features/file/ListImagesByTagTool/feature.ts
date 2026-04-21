import { createFeature } from "@webiny/feature/api";
import { ListImagesByTagTool } from "./ListImagesByTagTool.js";

export const ListImagesByTagToolFeature = createFeature({
    name: "AiPowerUps/ListImagesByTagTool",
    register(container) {
        container.register(ListImagesByTagTool);
    }
});
