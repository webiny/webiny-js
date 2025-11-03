import { createImplementation } from "@webiny/di";
import { Command, GetProjectSdkService, UiService } from "~/abstractions/index.js";

export class LogoutCommand implements Command.Interface<void> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        const projectSdk = await this.getProjectSdkService.execute();
        const wcp = projectSdk.wcp;
        const ui = this.uiService;

        return {
            name: "logout",
            description: "Log out from Webiny Control Panel",
            examples: ["$0 logout"],
            handler: async () => {
                wcp.unsetPatFromLocalStorage();
                ui.success(`You've successfully logged out from Webiny Control Panel.`);
            }
        };
    }
}

export const logoutCommand = createImplementation({
    abstraction: Command,
    implementation: LogoutCommand,
    dependencies: [GetProjectSdkService, UiService]
});
