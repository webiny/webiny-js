import { Container } from "@webiny/di";
import {
    deployCommand,
    destroyCommand,
    ddbPutItemConditionalCheckFailedGracefulErrorHandler,
    outputCommand,
    pendingOperationsGracefulErrorHandler,
    pulumiCommand,
    refreshCommand,
    watchCommand
} from "./features/index.js";
import { deployCommandWithTelemetry } from "./decorators/index.js";
import { awsGetProjectSdkService } from "./services/GetProjectSdkService.js";

export const registerAwsFeatures = (container: Container): void => {
    // Override the default GetProjectSdkService so the AWS project features
    // (e.g. AwsWatch decorator) are registered into the ProjectSdk container.
    container.register(awsGetProjectSdkService).inSingletonScope();

    container.register(watchCommand).inSingletonScope();
    container.register(deployCommand).inSingletonScope();
    container.register(destroyCommand).inSingletonScope();
    container.register(pulumiCommand).inSingletonScope();
    container.register(outputCommand).inSingletonScope();
    container.register(refreshCommand).inSingletonScope();

    container.register(ddbPutItemConditionalCheckFailedGracefulErrorHandler).inSingletonScope();
    container.register(pendingOperationsGracefulErrorHandler).inSingletonScope();

    container.registerDecorator(deployCommandWithTelemetry);
};
