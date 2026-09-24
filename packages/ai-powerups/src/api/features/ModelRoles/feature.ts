import { createFeature } from "@webiny/feature/api";
import ModelRolesHandler from "./ModelRolesHandler.js";

export const ModelRolesFeature = createFeature({
    name: "AiPowerUpsModelRoles",
    register(container) {
        container.register(ModelRolesHandler);
    }
});
