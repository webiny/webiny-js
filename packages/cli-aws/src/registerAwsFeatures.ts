import { Container } from "@webiny/di";
import { deployCommand } from "./features/index.js";
import { destroyCommand } from "./features/index.js";
import { ddbPutItemConditionalCheckFailedGracefulErrorHandler } from "./features/index.js";
import { infoCommand } from "./features/index.js";
import { openCommand } from "./features/index.js";
import { outputCommand } from "./features/index.js";
import { pendingOperationsGracefulErrorHandler } from "./features/index.js";
import { pulumiCommand } from "./features/index.js";
import { refreshCommand } from "./features/index.js";
import { watchCommand } from "./features/index.js";
import { deployCommandWithTelemetry } from "./decorators/index.js";
import { awsGetProjectSdkService } from "./services/GetProjectSdkService.js";
import { getAwsProjectSdkService } from "./services/GetAwsProjectSdkService.js";

export const registerAwsFeatures = (container: Container): void => {
    // Override the default GetProjectSdkService so the AWS project features
    // (e.g. AwsWatch decorator) are registered into the ProjectSdk container.
    container.register(awsGetProjectSdkService).inSingletonScope();
    container.register(getAwsProjectSdkService).inSingletonScope();

    container.register(watchCommand).inSingletonScope();
    container.register(deployCommand).inSingletonScope();
    container.register(destroyCommand).inSingletonScope();
    container.register(pulumiCommand).inSingletonScope();
    container.register(infoCommand).inSingletonScope();
    container.register(openCommand).inSingletonScope();
    container.register(outputCommand).inSingletonScope();
    container.register(refreshCommand).inSingletonScope();

    container.register(ddbPutItemConditionalCheckFailedGracefulErrorHandler).inSingletonScope();
    container.register(pendingOperationsGracefulErrorHandler).inSingletonScope();

    container.registerDecorator(deployCommandWithTelemetry);
};
