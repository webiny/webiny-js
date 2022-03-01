import {
    CliCommandScaffoldCallableArgs,
    CliCommandScaffoldTemplate
} from "@webiny/cli-plugin-scaffold/types";
import githubActions, { GithubActionsInput } from "~/githubActions";
import { CliPluginsScaffoldCi } from "~/types";
import link from "terminal-link";

const runHookCallback = async (
    hookName: string,
    args: CliCommandScaffoldCallableArgs<GithubActionsInput>[]
): Promise<void> => {
    const [{ input, context }] = args;
    const plugin = context.plugins
        .byType<CliPluginsScaffoldCi<GithubActionsInput>>("cli-plugin-scaffold-ci")
        .find(item => item.provider === input.provider);

    if (!plugin) {
        return;
    } else if (typeof plugin[hookName] !== "function") {
        return;
    }

    await plugin[hookName](...args);
};

const SCAFFOLD_DOCS_LINK = "https://www.webiny.com/docs/how-to-guides/scaffolding/ci-cd";

export default (): [
    CliCommandScaffoldTemplate<GithubActionsInput>,
    CliPluginsScaffoldCi<GithubActionsInput>
] => [
    {
        name: "cli-plugin-scaffold-template-ci",
        type: "cli-plugin-scaffold-template",
        scaffold: {
            name: "Set up CI/CD",
            description:
                "Sets up a CI/CD pipeline for your Webiny project using a\n  provider of your choice." +
                (link.isSupported ? " " + link("Learn more.", SCAFFOLD_DOCS_LINK) : ""),
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
