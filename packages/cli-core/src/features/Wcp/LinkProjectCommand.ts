import { createImplementation } from "@webiny/di";
import inquirer from "inquirer";
import { Command, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { setTimeout } from "node:timers/promises";

const sleep = (ms: number = 1500) => setTimeout(ms);

export class LinkProjectCommand implements Command.Interface<void> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        const projectSdk = await this.getProjectSdkService.execute();
        const wcp = projectSdk.wcp;
        const ui = this.uiService;

        return {
            name: "link-project",
            description: "Link a Webiny project with Webiny Control Panel",
            examples: ["$0 link-project"],
            handler: async () => {
                const user = await wcp.getUser();

                if (!user) {
                    ui.error("You must be logged in to link a project.");
                    return;
                }

                // User already linked a project?
                const orgProjectId = await projectSdk.getProjectId();
                if (orgProjectId) {
                    const [, projectId] = orgProjectId.split("/");
                    const project = user.projects.find(item => item.id === projectId);
                    if (project) {
                        ui.info("Your %s project is already linked.", orgProjectId);

                        const prompt = inquirer.createPromptModule();
                        const { proceed } = await prompt({
                            name: "proceed",
                            message: "Would you like to re-link it?",
                            type: "confirm",
                            default: false
                        });

                        if (!proceed) {
                            return;
                        }

                        ui.newLine();
                    }
                }

                const wcpAppUrl = projectSdk.wcp.getWcpAppUrl().toString();

                // Get user's organizations.
                if (!user.orgs.length) {
                    ui.info(
                        "It seems you're not part of any organization. Please log in to Webiny Control Panel and create one."
                    );

                    const prompt = inquirer.createPromptModule();
                    const { proceed } = await prompt({
                        name: "proceed",
                        message: "Would you like to do that now?",
                        type: "confirm",
                        default: false
                    });

                    if (proceed) {
                        open(wcpAppUrl);
                    }
                    return;
                }

                let selectedOrg;
                if (user.orgs.length === 1) {
                    selectedOrg = user.orgs[0];
                } else {
                    ui.info("It seems you're part of multiple organizations. ");
                    const choices = user.orgs.map(item => ({
                        name: item.name,
                        value: item
                    }));

                    const prompt = inquirer.createPromptModule();
                    selectedOrg = await prompt({
                        name: "org",
                        message: "Select organization:",
                        type: "list",
                        choices,
                        default: choices[0].value
                    }).then(result => result.org);
                }

                const orgProjects = user.projects.filter(item => item.org.id === selectedOrg.id);

                // Get user's projects.
                if (!orgProjects.length) {
                    ui.info(
                        "It seems there are no projects created within the %s organization.",
                        selectedOrg.name
                    );

                    const prompt = inquirer.createPromptModule();
                    const { proceed } = await prompt({
                        name: "proceed",
                        message: "Would you like to create one now?",
                        type: "confirm",
                        default: false
                    });

                    if (proceed) {
                        open(wcpAppUrl);
                    }
                    return;
                }

                let selectedProject;
                if (orgProjects.length === 1) {
                    selectedProject = user.projects[0];
                } else {
                    ui.info(
                        `It seems there are multiple projects created within the organization.`,
                        selectedOrg.name
                    );
                    const choices = orgProjects.map(item => ({
                        name: item.name,
                        value: item
                    }));
                    const prompt = inquirer.createPromptModule();
                    selectedProject = await prompt({
                        name: "project",
                        message: "Select project:",
                        type: "list",
                        choices,
                        default: choices[0].value
                    }).then(result => result.project);
                }

                await sleep();
                ui.newLine();

                ui.info("Linking %s project...", selectedProject.name);

                await sleep();

                // Assign the necessary IDs into root `webiny.project.ts` project file.
                await projectSdk.setProjectId(selectedProject.id, { force: true });

                ui.success(`%s Project %s linked successfully.`, "✔", selectedProject.name);

                await sleep();

                ui.newLine();
                ui.textBold("Next Steps");

                ui.text(`‣ deploy your project via the yarn webiny deploy command`);
            }
        };
    }
}

export const linkProjectCommand = createImplementation({
    abstraction: Command,
    implementation: LinkProjectCommand,
    dependencies: [GetProjectSdkService, UiService]
});
