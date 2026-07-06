import { type Container, createFeature } from "@webiny/feature/api";
import { TaskServiceTransport } from "@webiny/background-tasks/api";
import { WorkerTransportPlugin } from "~/service/WorkerTransportPlugin.js";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container: Container) {
        container.registerInstance(
            TaskServiceTransport,
            new WorkerTransportPlugin({ default: true })
        );
    }
});
