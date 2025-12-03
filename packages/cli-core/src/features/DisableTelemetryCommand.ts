import { createImplementation } from "@webiny/di";
import { CliCommand, UiService } from "~/abstractions/index.js";
import { disable as disableTelemetry, sendEvent } from "@webiny/telemetry/cli.js";

export class DisableTelemetryCommand implements CliCommand.Interface<void> {
    constructor(private uiService: UiService.Interface) {}

    execute() {
        const ui = this.uiService;

        return {
            name: "disable-telemetry",
            description: "Disables Webiny telemetry",
            handler: async () => {
                disableTelemetry();
                await sendEvent({ event: "disable-telemetry", properties: {} });
                ui.info(
                    `Webiny telemetry is now %s! Thank you for helping us in making Webiny better!`,
                    "disabled"
                );
                ui.info(
                    `For more information, please visit the following link: https://www.webiny.com/telemetry.`
                );
            }
        };
    }
}

export const disableTelemetryCommand = createImplementation({
    abstraction: CliCommand,
    implementation: DisableTelemetryCommand,
    dependencies: [UiService]
});
