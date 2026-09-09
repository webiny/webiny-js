import {
    isEnabled as globalIsTelemetryEnabled,
    sendEvent as telemetrySendEvent
} from "@webiny/telemetry/cli.js";
import { CliCommandFactory, GetProjectSdkService } from "@webiny/cli-core/abstractions/index.js";
import { GracefulError } from "@webiny/project";

interface IServeCommandParams {
    _: string[];
    app?: string;
}

const isServeCommand = (
    command: CliCommandFactory.CommandDefinition<any>
): command is CliCommandFactory.CommandDefinition<IServeCommandParams> => {
    return command.name === "serve";
};

/**
 * Self-hosted counterpart to cli-aws's `DeployCommandWithTelemetry`. AWS projects report a deploy;
 * self-hosted ones have no deploy, so `serve` is the event that says a project actually came up.
 * Without it, the last self-hosted signal after project creation is `admin-app-start` from the
 * browser, which leaves no way to tell a running project from an abandoned one.
 *
 * There is deliberately no `-end` event. Serve runs until interrupted, and the SIGINT teardown in
 * the server runners calls `process.exit`, so an "end" event would almost never make it out and the
 * count would read as a near-total drop-off. Start plus the error events carry the useful signal.
 *
 * `watch` stays untracked on purpose: cli-aws does not track its own watch command, and tracking it
 * on one hosting type only would make the two look different for a reason that has nothing to do
 * with hosting.
 */
export class ServeCommandWithTelemetry<TParams> implements CliCommandFactory.Interface<TParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private decoratee: CliCommandFactory.Interface<TParams>
    ) {}

    async execute() {
        const command = await this.decoratee.execute();

        if (!isServeCommand(command)) {
            return command;
        }

        if (!globalIsTelemetryEnabled()) {
            return command;
        }

        const projectSdk = await this.getProjectSdkService.execute();
        const projectSdkTelemetryEnabled = await projectSdk.isTelemetryEnabled();
        if (!projectSdkTelemetryEnabled) {
            return command;
        }

        const serveCommand = command as CliCommandFactory.CommandDefinition<IServeCommandParams>;
        const originalCommandHandler = serveCommand.handler;

        serveCommand.handler = async (params: IServeCommandParams) => {
            // "all" rather than "unknown": omitting the app is how you serve both apps at once, so
            // an absent value is a real choice, not missing data.
            const telemetryProperties = {
                app: params.app || "all"
            };

            try {
                await this.sendEvent("cli-project-serve-start", telemetryProperties);

                return await originalCommandHandler(params);
            } catch (e) {
                const event =
                    e instanceof GracefulError
                        ? "cli-project-serve-error-graceful"
                        : "cli-project-serve-error";

                await this.sendEvent(event, {
                    ...telemetryProperties,
                    errorMessage: e.message,
                    errorStack: e.stack
                });

                throw e;
            }
        };

        return command;
    }

    private sendEvent(event: string, properties: Record<string, any> = {}) {
        return telemetrySendEvent({
            event,
            properties
        });
    }
}

export const serveCommandWithTelemetry = CliCommandFactory.createDecorator({
    decorator: ServeCommandWithTelemetry,
    dependencies: [GetProjectSdkService]
});
