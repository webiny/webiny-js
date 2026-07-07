import { createFeature } from "@webiny/feature/api";
import { StepFunctionService } from "~/service/StepFunctionService.js";
import { BackgroundTaskLambdaHandler } from "~/BackgroundTaskLambdaHandler.js";

export const BackgroundTasksAwsFeature = createFeature({
    name: "BackgroundTasksAws",
    register(container) {
        container.register(BackgroundTaskLambdaHandler);
        container.register(StepFunctionService);
    }
});
