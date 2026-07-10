import { type Container, createFeature } from "@webiny/feature/api";
import { MockDataCreatorTaskDefinition } from "~/tasks/MockDataCreatorTask.js";
import { MockDataManagerTaskDefinition } from "~/tasks/MockDataManagerTask.js";

export const HeadlessCmsEsTasksFeature = createFeature({
    name: "HeadlessCmsEsTasks",
    register(container: Container) {
        container.register(MockDataCreatorTaskDefinition);
        container.register(MockDataManagerTaskDefinition);
    }
});
