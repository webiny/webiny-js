import { createFeature } from "@webiny/feature/api";
import ProjectsHandler from "./ProjectsHandler.js";

export const ProjectsFeature = createFeature({
    name: "AiPowerUpsProjects",
    register(container) {
        container.register(ProjectsHandler);
    }
});
