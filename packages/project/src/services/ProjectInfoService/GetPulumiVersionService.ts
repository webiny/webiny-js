import { createImplementation } from "@webiny/di-container";
import { GetPulumiVersionService } from "~/abstractions/index.js";
import execa from "execa";

export class DefaultGetPulumiVersion implements GetPulumiVersionService.Interface {
    execute() {
        const result : GetPulumiVersionService.Result = ["", ""];

        try {
            {
                const { stdout } = execa.sync("yarn", [
                    "info",
                    "@pulumi/pulumi",
                    "-A",
                    "-R",
                    "--name-only",
                    "--json"
                ]);

                const match = stdout.match(/npm:(.*?)"/);
                if (match) {
                    result[0] = match[1];
                }
            }

            {
                const { stdout } = execa.sync("yarn", [
                    "info",
                    "@pulumi/aws",
                    "-A",
                    "-R",
                    "--name-only",
                    "--json"
                ]);

                const match = stdout.match(/npm:(.*?)"/);
                if (match) {
                    result[1] = match[1];
                }
            }
        } catch {
            // Do nothing.
        }

        return result;
    }
}

export const getPulumiVersionService = createImplementation({
    abstraction: GetPulumiVersionService,
    implementation: DefaultGetPulumiVersion,
    dependencies: []
});
