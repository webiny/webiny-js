import {
    CliCommandScaffoldCallableArgs,
    CliCommandScaffoldTemplate
} from "@webiny/cli-plugin-scaffold/types";
import githubActions from "./githubActions";
import { CliPluginsScaffoldCi } from "./types";

interface Input {
    provider: string;
    [key: string]: any;
}

const runHookCallback = async (hookName: string, args: CliCommandScaffoldCallableArgs<Input>[]) => {
    const [{ input, context }] = args;
    const plugin = context.plugins
        .byType<CliPluginsScaffoldCi<Input>>("cli-plugin-scaffold-ci")
        .find(item => item.provider === input.provider);

    if (typeof plugin[hookName] === "function") {
        await plugin[hookName](...args);
    }
};

export default (): [CliCommandScaffoldTemplate<Input>, CliPluginsScaffoldCi<Input>] => [
    {
        name: "cli-plugin-scaffold-template-ci",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "Set up a CI/CD pipeline",
            questions: () => {
                return [
                    {
                        name: "provider",
                        type: "list",
                        choices: [{ name: "GitHub Actions", value: "githubActions" }],
                        message: "Choose your CI/CD provider:",
                        default: "githubActions"
                    },
                    // TODO: in the future, add questions via plugins, not hardcoded.
                    ...githubActions.questions()
                ];
            },
            generate: async (...args) => {
                await runHookCallback("generate", args);
            },
            onGenerate: async (...args) => {
                await runHookCallback("onGenerate", args);
            },
            onSuccess: async (...args) => {
                await runHookCallback("onSuccess", args);
            },
            onError: async (...args) => {
                await runHookCallback("onError", args);
            }
        }
    },
    githubActions
];
