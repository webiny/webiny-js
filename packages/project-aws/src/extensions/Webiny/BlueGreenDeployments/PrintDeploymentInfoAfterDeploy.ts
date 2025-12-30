import {
    AfterDeploy,
    GetAppStackOutput,
    ProjectSdkParamsService,
    UiService
} from "@webiny/project/abstractions/index.js";
import { IBlueGreenStackOutput } from "~/pulumi/apps/blueGreen/types.js";
import chalk from "chalk";

export interface IEnvironment {
    name: string;
    env: string;
    variant: string | undefined;
    domains: {
        [key: string]: string;
    };
}

class PrintDeploymentInfoAfterDeployImpl implements AfterDeploy.Interface {
    constructor(
        private ui: UiService.Interface,
        private getAppStackOutput: GetAppStackOutput.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: AfterDeploy.Params) {
        if (params.app !== "blueGreen") {
            return;
        }

        const { blue, green } = chalk;

        const bg = await this.getAppStackOutput.execute<IBlueGreenStackOutput>("blueGreen");

        if (!bg) {
            this.ui.info(
                "Blue / Green deployment info could not be printed because the Blue / Green app is not deployed."
            );
            return;
        }

        const sdkParams = this.projectSdkParamsService.get();

        const domains = Array.isArray(bg.domains) ? bg.domains : [];

        const environments = (bg.environments || []).reduce<IEnvironment[]>((items, item) => {
            const index = items.findIndex(i => i.name === item.name);
            if (index >= 0) {
                items[index].domains[item.type] = item.target;

                return items;
            }

            items.push({
                name: item.name,
                env: item.env,
                variant: item.variant,
                domains: {
                    [item.type]: item.target
                }
            });

            return items;
        }, []);

        const output = [
            "",
            green(`Blue / Green Router`),
            `‣ Environment name: ${blue(sdkParams.env)}`,
            `‣ CloudFront domain: ${bg.distributionDomain}`,
            `‣ CloudFront URL: ${bg.distributionUrl}`,
            "",
            `‣ Domains attached: `,
            ...domains.map(domain => `  - https://${domain}`),
            "",
            `‣ Environments: `,
            ...environments.map(item => {
                const envVariant = `env: ${item.env}${
                    item.variant ? ` / variant: ${item.variant}` : ""
                }`;
                return [
                    `  - ${blue(item.name)} (${envVariant})`,
                    ...Object.keys(item.domains).map(type => {
                        return `    - ${type}: https://${item.domains[type]}`;
                    })
                ].join("\n");
            }),
            ""
        ];
        console.log(output.join("\n"));
    }
}

export const PrintDeploymentInfoAfterDeploy = AfterDeploy.createImplementation({
    implementation: PrintDeploymentInfoAfterDeployImpl,
    dependencies: [UiService, GetAppStackOutput, ProjectSdkParamsService]
});
