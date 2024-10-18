import { CliCommandScaffoldTemplate } from "@webiny/cli-plugin-scaffold/types";
import { downloadAndLinkExtension } from "@webiny/cli-plugin-extensions/downloadAndLinkExtension";
import { Input, promptQuestions } from "@webiny/cli-plugin-extensions/promptQuestions";
import { generateExtension } from "@webiny/cli-plugin-extensions/generateExtension";

export default () => [
    {
        name: "cli-plugin-scaffold-template-extensions",
        type: "cli-plugin-scaffold-template",
        templateName: "extension",
        scaffold: {
            name: "New Extension",
            description: "Scaffolds essential files for creating a new extension.",
            questions: promptQuestions,
            generate: async params => {
                // The `templateArgs` is used by this scaffold to identify if the user wants
                // to download an extension from the Webiny examples repository.
                const downloadExtensionSource = params.input.templateArgs;
                if (downloadExtensionSource) {
                    return downloadAndLinkExtension({
                        source: downloadExtensionSource,
                        context: params.context,
                        ora: params.ora
                    });
                }

                return generateExtension(params);
            }
        }
    } as CliCommandScaffoldTemplate<Input>
];
