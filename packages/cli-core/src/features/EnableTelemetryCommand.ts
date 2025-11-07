import { createImplementation } from "@webiny/di";
import { Command, UiService } from "~/abstractions/index.js";
import { enable as enableTelemetry, sendEvent } from "@webiny/telemetry/cli.js";

export class EnableTelemetryCommand implements Command.Interface<void> {
    constructor(private uiService: UiService.Interface) {}

    execute() {
        const ui = this.uiService;

        return {
            name: "enable-telemetry",
            description: "Enables Webiny telemetry",
            handler: async () => {
                enableTelemetry();
                await sendEvent({ event: "enable-telemetry", properties: {} });
                ui.info(
                    `Webiny telemetry is now %s! Thank you for helping us in making Webiny better!`,
                    "enabled"
                );
                ui.info(
                    `For more information, please visit the following link: https://www.webiny.com/telemetry.`
                );
            }
        };
    }
}

export const enableTelemetryCommand = createImplementation({
    abstraction: Command,
    implementation: EnableTelemetryCommand,
    dependencies: [UiService]
});
