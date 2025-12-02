import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";

export class WhoAmICommand implements CliCommand.Interface<void> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        const projectSdk = await this.getProjectSdkService.execute();
        const wcp = projectSdk.wcp;
        const ui = this.uiService;

        return {
            name: "whoami",
            description: "Display the current logged-in user",
            examples: ["$0 whoami"],
            handler: async () => {
                try {
                    const user = await wcp.getUser();
                    if (!user) {
                        throw new Error();
                    }
                    ui.info("You are logged in to Webiny Control Panel as %s.", user.email);
                } catch {
                    throw new Error(
                        `It seems you are not logged in. Please login using the "yarn webiny login" command.`
                    );
                }
            }
        };
    }
}

export const whoAmICommand = CliCommand.createImplementation({
    implementation: WhoAmICommand,
    dependencies: [GetProjectSdkService, UiService]
});
