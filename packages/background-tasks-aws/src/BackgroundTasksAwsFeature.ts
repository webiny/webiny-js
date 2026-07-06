import { type Container, createFeature } from "@webiny/feature/api";
import { TaskServiceTransport } from "@webiny/background-tasks/api";
import { StepFunctionServicePlugin } from "~/service/StepFunctionServicePlugin.js";
import { EventBridgeEventTransportPlugin } from "~/service/EventBridgeEventTransportPlugin.js";

export const BackgroundTasksAwsFeature = createFeature({
    name: "BackgroundTasksAws",
    register(container: Container) {
        container.registerInstance(
            TaskServiceTransport,
            new StepFunctionServicePlugin({ default: true })
        );
        container.registerInstance(TaskServiceTransport, new EventBridgeEventTransportPlugin());
    }
});
