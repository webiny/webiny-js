import {
    GetApp,
    ListAppLambdaFunctionsService,
    LoggerService,
    ProjectSdkParamsService,
    PulumiExportService,
    PulumiGetStackOutputService,
    UiService,
    Watch,
    WatchedLambdaFunctionsService
} from "@webiny/project/abstractions/index.js";
import chalk from "chalk";
import type inspectorType from "inspector";
import { type ICoreStackOutput } from "@webiny/project/abstractions/features/GetAppStackOutput.js";
import { getIotEndpoint } from "./getIotEndpoint.js";
import { replaceLambdaFunctions } from "./replaceLambdaFunctions.js";
import { initInvocationForwarding } from "@webiny/project/features/Watch/initInvocationForwarding.js";

export class AwsWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private listAppLambdaFunctionsService: ListAppLambdaFunctionsService.Interface,
        private ui: UiService.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface,
        private pulumiExportService: PulumiExportService.Interface,
        private watchedLambdaFunctionsService: WatchedLambdaFunctionsService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params): Promise<Watch.Result> {
        // Validate Lambda-specific params before the base runs workspace build.
        if ("app" in params && params.increaseTimeout && params.increaseTimeout > 900) {
            throw new Error(
                `When increasing the timeout, the maximum value that can be passed is 900 seconds (15 minutes).`
            );
        }

        const result = await this.decoratee.execute(params);

        // No Lambda machinery for package-only watch.
        if (!("app" in params)) {
            return result;
        }

        const app = this.getApp.execute(params.app);
        const sdkParams = this.projectSdkParamsService.get();
        const ui = this.ui;
        const logger = this.logger;

        const functionsWhitelist = Array.isArray(params.function)
            ? params.function
            : ([params.function].filter(Boolean) as string[]);

        const functionsList = await this.listAppLambdaFunctionsService.execute(app, {
            whitelist: functionsWhitelist
        });

        const deployCommand = `yarn webiny deploy ${app.name} --env ${sdkParams.env}`;
        const learnMoreLink = "https://webiny.link/local-aws-lambda-development";
        const troubleshootingLink = learnMoreLink + "#troubleshooting";

        if (functionsList.meta.count === 0) {
            if (functionsList.meta.totalCount > 0) {
                ui.info(
                    [
                        "No AWS Lambda functions will be invoked locally. If this is unexpected, you can try the following:",
                        " ‣ stop the current development session",
                        " ‣ redeploy the %s application by running %s command",
                        " ‣ start a new %s session by rerunning %s command",
                        "",
                        "Learn more: %s"
                    ].join("\n"),
                    app.name,
                    deployCommand,
                    "webiny watch",
                    "webiny watch",
                    troubleshootingLink
                );
            }
            return result;
        }

        ui.info(`Local AWS Lambda development session started.`);
        ui.warning(
            `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
            app.getDisplayName(),
            "MUST",
            deployCommand,
            learnMoreLink
        );

        logger.debug(
            "The events for following AWS Lambda functions will be forwarded locally: ",
            functionsList.list.map(fn => fn.name)
        );

        ui.emptyLine();
        const { default: exitHook } = await import(/* webpackChunkName: "exit-hook" */ "exit-hook");

        exitHook(() => {
            console.log();
            console.log();

            ui.info(`Terminating local AWS Lambda development session.`);
            ui.warning(
                `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
                app?.getDisplayName(),
                "MUST",
                deployCommand,
                learnMoreLink
            );
        });

        const coreApp = this.getApp.execute("core");
        const coreStackOutput =
            await this.pulumiGetStackOutputService.execute<ICoreStackOutput>(coreApp);

        if (!coreStackOutput) {
            throw new Error(
                `You must deploy the ${chalk.bold(
                    "core"
                )} app before you can start a watch session. To do that, run: ${chalk.bold(
                    `yarn webiny deploy core --env ${sdkParams.env}`
                )}`
            );
        }

        const deploymentId = coreStackOutput?.deploymentId;
        const iotEndpointTopic = `webiny-watch-${deploymentId}`;
        const iotEndpoint = await getIotEndpoint(coreStackOutput);

        const sessionId = new Date().getTime();
        const increaseTimeout = params.increaseTimeout;
        const localExecutionHandshakeTimeout = params.increaseHandshakeTimeout || 5;

        replaceLambdaFunctions({
            app,
            deploymentId,
            dependencies: {
                uiService: ui,
                loggerService: logger,
                pulumiExportService: this.pulumiExportService,
                watchedLambdaFunctionsService: this.watchedLambdaFunctionsService
            },
            iotEndpoint,
            iotEndpointTopic,
            sessionId,
            functionsList,
            increaseTimeout,
            localExecutionHandshakeTimeout
        });

        let inspector: typeof inspectorType | undefined = undefined;
        if (params.inspect) {
            inspector = await import("inspector");
            inspector!.open(9229, "127.0.0.1");
            ui.emptyLine();

            exitHook(() => {
                inspector!.close();
            });
        }

        initInvocationForwarding({
            iotEndpoint,
            iotEndpointTopic,
            functionsList,
            sessionId
        });

        return result;
    }
}

export const awsWatch = Watch.createDecorator({
    decorator: AwsWatch,
    dependencies: [
        GetApp,
        LoggerService,
        ListAppLambdaFunctionsService,
        UiService,
        PulumiGetStackOutputService,
        PulumiExportService,
        WatchedLambdaFunctionsService,
        ProjectSdkParamsService
    ]
});
