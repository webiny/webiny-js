import { type Container, createFeature } from "@webiny/feature/api";
import { HcmsTasksInitializer } from "./HcmsTasksInitializer.js";

export const HcmsTasksFeature = createFeature({
    name: "HcmsTasks",
    register(container: Container) {
        container.register(HcmsTasksInitializer);
    }
});
