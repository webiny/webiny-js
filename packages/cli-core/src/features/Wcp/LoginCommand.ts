import { createImplementation } from "@webiny/di";
import { IWcpUserPatModel } from "@webiny/project/abstractions/models/index.js";
import {
    CliCommandFactory,
    GetProjectSdkService,
    LoggerService,
    UiService
} from "~/abstractions/index.js";
import { setTimeout } from "node:timers/promises";
import { WcpUserPatModel } from "@webiny/project/models/index.js";
import open from "open";

const sleep = (ms: number = 1500) => setTimeout(ms);

// 120 retries * 2000ms interval = 4 minutes until the command returns an error.
const LOGIN_RETRIES_COUNT = 30;
const LOGIN_RETRIES_INTERVAL = 2_000;

interface ILoginCommandParams {
    pat?: string;
}

export class LoginCommand implements CliCommandFactory.Interface<ILoginCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<ILoginCommandParams>> {
        return {
            name: "login",
            description: "Log in to Webiny Control Panel",
            examples: ["$0 login"],
            options: [
                {
                    name: "pat",
                    description: "Personal Access Token (PAT) to use for authentication",
                    type: "string"
                }
            ],
            handler: async ({ pat: patFromParams }: ILoginCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const wcp = projectSdk.wcp;
                const ui = this.uiService;
                const logger = this.loggerService;

                let pat: IWcpUserPatModel | null = null;

                if (patFromParams) {
                    pat = await wcp.getUserPat(patFromParams);

                    // If we've received a PAT that has expiration, let's create a long-lived PAT.
                    // We don't want to have our users interrupted because of an expired PAT.
                    if (pat && pat.expiresOn) {
                        pat = await wcp.createUserPat({ meta: pat.meta }, pat.token);
                    }
                } else {
                    const generatedPat = await wcp.generateUserPat();

                    const queryParams = `pat=${generatedPat}&pat_name=${encodeURIComponent(
                        "Webiny CLI"
                    )}&ref=cli`;

                    const openUrl = wcp.getWcpAppUrl().join(`/login/cli?${queryParams}`).toString();

                    logger.debug(`Opening %s...`, openUrl);
                    await open(openUrl);

                    const graphql = {
                        variables: { token: generatedPat },
                        headers: {
                            Authorization: generatedPat
                        }
                    };

                    let retries = 0;

                    const result = await new Promise<WcpUserPatModel | null>(resolve => {
                        const interval = setInterval(async () => {
                            retries++;
                            if (retries > LOGIN_RETRIES_COUNT) {
                                clearInterval(interval);
                                resolve(null);
                            }

                            try {
                                const pat = await wcp.getUserPat(generatedPat);
                                clearInterval(interval);
                                resolve(pat);
                            } catch (err) {
                                // Do nothing.
                                logger.debug(
                                    {
                                        err,
                                        graphqlRequest: graphql
                                    },
                                    `Could not login. Will try again in ${LOGIN_RETRIES_INTERVAL}ms.`
                                );
                            }
                        }, LOGIN_RETRIES_INTERVAL);
                    });

                    if (!result) {
                        throw new Error(
                            `Could not login. Did you complete the sign in / sign up process at ${wcp
                                .getWcpAppUrl()
                                .toString()}?`
                        );
                    }

                    pat = result;
                }

                if (!pat) {
                    throw new Error(
                        `Could not log in. Could not obtain a valid Personal Access Token.`
                    );
                }

                projectSdk.wcp.storePatToLocalStorage(pat.token);

                ui.success(`%s You've successfully logged in to Webiny Control Panel.`, "✔");

                let projectLinked = await projectSdk.getProjectId().then(id => !!id);
                if (projectLinked) {
                    return;
                }

                // If we have `orgId` and `projectId` in PAT's metadata, let's immediately link the project.
                if (pat.meta && pat.meta.orgId && pat.meta.projectId) {
                    await sleep();
                    ui.emptyLine();

                    const { orgId, projectId } = pat.meta;

                    const id = `${orgId}/${projectId}`;
                    ui.info(`Project %s detected. Linking...`, id);
                    await projectSdk.setProjectId(id);

                    await sleep();
                    ui.success(`Project %s linked successfully.`, id);
                    projectLinked = true;
                }

                await sleep();

                ui.emptyLine();
                ui.textBold("Next Steps");

                if (!projectLinked) {
                    ui.text(`‣ link your project via the "yarn webiny project link" command`);
                }

                ui.text(`‣ deploy your project via the "yarn webiny deploy" command`);
            }
        };
    }
}

export const loginCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: LoginCommand,
    dependencies: [GetProjectSdkService, UiService, LoggerService]
});
