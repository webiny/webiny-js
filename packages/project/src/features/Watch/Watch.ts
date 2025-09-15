import { createImplementation } from "@webiny/di-container";
import {
    GetApp,
    GetProductionEnvironments,
    GetProject,
    GetProjectConfigService,
    ListAppLambdaFunctionsService,
    ListPackagesService,
    LoggerService,
    PulumiGetStackExportService,
    PulumiGetStackOutputService,
    UiService,
    ValidateProjectConfigService,
    Watch
} from "~/abstractions/index.js";
import chalk from "chalk";
import type inspectorType from "inspector";
import { PackagesWatcher } from "./watchers/PackagesWatcher.js";
import { WebinyConfigWatcher } from "~/features/Watch/watchers/WebinyConfigWatcher.js";
import { type ICoreStackOutput } from "~/abstractions/features/GetAppStackOutput.js";
import { getIotEndpoint } from "./getIotEndpoint.js";
import { replaceLambdaFunctions } from "~/features/Watch/replaceLambdaFunctions.js";
import { initInvocationForwarding } from "./initInvocationForwarding.js";

export class DefaultWatch implements Watch.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private listAppLambdaFunctionsService: ListAppLambdaFunctionsService.Interface,
        private listPackagesService: ListPackagesService.Interface,
        private getProject: GetProject.Interface,
        private getProjectConfigService: GetProjectConfigService.Interface,
        private validateProjectConfigService: ValidateProjectConfigService.Interface,
        private getProductionEnvironments: GetProductionEnvironments.Interface,
        private ui: UiService.Interface,
        private pulumiGetStackOutputService: PulumiGetStackOutputService.Interface,
        private pulumiGetStackExportService: PulumiGetStackOutputService.Interface
    ) {}

    async execute(params: Watch.Params) {
        const hasAppOrPackage = "app" in params || "package" in params;
        if (!hasAppOrPackage) {
            throw new Error(
                `Either "app" or "package" arguments must be passed. Cannot have both undefined.`
            );
        }

        // If we're not watching a specific app, we can only watch packages.
        if (!("app" in params)) {
            const whitelistArray = Array.isArray(params.package)
                ? params.package
                : ([params.package].filter(Boolean) as string[]);

            const packages = await this.listPackagesService.execute({
                whitelist: whitelistArray
            });

            const packagesWatcher = new PackagesWatcher({ packages, params, logger: this.logger });

            return { packagesWatcher };
        }

        // Get project application metadata. Will throw an error if an invalid folder is specified.
        const app = this.getApp.execute(params.app);

        if (!app) {
            throw new Error(
                `Invalid app name "${params.app}". Please specify a valid app name (core, api, or admin).`
            );
        }

        if (!params.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        const productionEnvironments = await this.getProductionEnvironments.execute();

        if (productionEnvironments.includes(params.env)) {
            if (!params.allowProduction) {
                throw new Error(
                    `${chalk.red(
                        "webiny watch"
                    )} command cannot be used with production environments.`
                );
            }
        }

        // A maximum of 15 minutes in seconds can be passed.
        if (params.increaseTimeout && params.increaseTimeout > 900) {
            throw new Error(
                `When increasing the timeout, the maximum value that can be passed is 900 seconds (15 minutes).`
            );
        }

        const ui = this.ui;
        const logger = this.logger;
        const project = this.getProject.execute();
        const getProjectConfigService = this.getProjectConfigService;
        const validateProjectConfigService = this.validateProjectConfigService;

        const webinyConfigWatcher = new WebinyConfigWatcher({
            webinyConfigPath: project.paths.webinyConfigFile.toString(),
            appName: params.app,
            getProjectConfigService,
            validateProjectConfigService
        });

        const packagesWhitelist = Array.isArray(params.package)
            ? params.package
            : ([params.package].filter(Boolean) as string[]);

        const functionsWhitelist = Array.isArray(params.function)
            ? params.function
            : ([params.function].filter(Boolean) as string[]);

        const packagesList = await this.listPackagesService.execute({
            ...params,
            whitelist: packagesWhitelist
        });
        const packagesWatcher = new PackagesWatcher({
            packages: packagesList,
            params,
            logger
        });

        const functionsList = await this.listAppLambdaFunctionsService.execute(app, {
            ...params,
            whitelist: functionsWhitelist
        });

        const deployCommand = `yarn webiny deploy ${app.name} --env ${params.env}`;
        const learnMoreLink = "https://webiny.link/local-aws-lambda-development";
        const troubleshootingLink = learnMoreLink + "#troubleshooting";

        if (functionsList.meta.count === 0) {
            // If functions exist, but none are selected for watching, show a warning.
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

            return { packagesWatcher, webinyConfigWatcher };
        }

        ui.info(`Local AWS Lambda development session started.`);
        ui.warning(
            `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
            app.name,
            "MUST",
            deployCommand,
            learnMoreLink
        );

        logger.debug(
            "The events for following AWS Lambda functions will be forwarded locally: ",
            functionsList.list.map(fn => fn.name)
        );

        ui.newLine();
        const { default: exitHook } = await import(/* webpackChunkName: "exit-hook" */ "exit-hook");

        exitHook(() => {
            console.log();
            console.log();

            ui.info(`Terminating local AWS Lambda development session.`);
            ui.warning(
                `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
                app?.name,
                "MUST",
                deployCommand,
                learnMoreLink
            );
        });

        const coreApp = this.getApp.execute("core");
        const coreStackOutput = await this.pulumiGetStackOutputService.execute<ICoreStackOutput>(
            coreApp,
            params
        );

        if (!coreStackOutput) {
            throw new Error(
                `You must deploy the ${chalk.bold(
                    "core"
                )} app before you can start a watch session. To do that, run: ${chalk.bold(
                    `yarn webiny deploy core --env ${params.env}`
                )}`
            );
        }

        const deploymentId = coreStackOutput?.deploymentId;

        const iotEndpointTopic = `webiny-watch-${deploymentId}`;
        const iotEndpoint = await getIotEndpoint(coreStackOutput);

        const sessionId = new Date().getTime();
        const increaseTimeout = params.increaseTimeout;
        const localExecutionHandshakeTimeout = params.increaseHandshakeTimeout || 5; // Default to 5 seconds.

        // TODO: we need a better solution for this.
        // We want to ensure a Pulumi refresh is made before the next deploy.
        // setMustRefreshBeforeDeploy(context);

        // Ignore promise, we don't need to wait for this to finish.
        replaceLambdaFunctions({
            app,
            dependencies: {
                uiService: ui,
                loggerService: logger,
                pulumiGetStackExportService: this.pulumiGetStackExportService
            },
            watchParams: params,
            iotEndpoint,
            iotEndpointTopic,
            sessionId,
            functionsList,
            increaseTimeout,
            localExecutionHandshakeTimeout
        });

        let inspector: typeof inspectorType | undefined = undefined;
        if (params.inspect) {
            //eslint-disable-next-line import/dynamic-import-chunkname
            inspector = await import("inspector");
            inspector!.open(9229, "127.0.0.1");
            ui.newLine();

            exitHook(() => {
                inspector!.close();
            });
        }

        // Ignore promise, we don't need to wait for this to finish.
        initInvocationForwarding({
            iotEndpoint,
            iotEndpointTopic,
            functionsList,
            sessionId
        });

        return { packagesWatcher };
    }
}

export const watch = createImplementation({
    abstraction: Watch,
    implementation: DefaultWatch,
    dependencies: [
        GetApp,
        LoggerService,
        ListAppLambdaFunctionsService,
        ListPackagesService,
        GetProject,
        GetProjectConfigService,
        ValidateProjectConfigService,
        GetProductionEnvironments,
        UiService,
        PulumiGetStackOutputService,
        PulumiGetStackExportService
    ]
});
