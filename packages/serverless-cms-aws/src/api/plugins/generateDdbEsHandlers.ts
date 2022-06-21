import { CliContext } from "@webiny/cli/types";
import * as fs from "fs";
import * as path from "path";

export const generateDdbEsHandlers = {
    type: "hook-before-build",
    name: "hook-before-build-generate-api-ddb-es-handlers",
    // @ts-ignore
    async hook({ projectApplication }, context: CliContext) {
        const handlersPaths = [
            "graphql",
            "pageBuilder/exportPages/combine",
            "pageBuilder/exportPages/process",
            "pageBuilder/importPages/create",
            "pageBuilder/importPages/process"
        ];

        context.info("Generating system AWS Lambda functions code...");

        for (let i = 0; i < handlersPaths.length; i++) {
            const [from, relativeTo] = handlersPaths[i];

            const to = path.join(projectApplication.paths.workspace, relativeTo);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(to, { recursive: true });
            }

            fs.copyFileSync(from, to);
        }

        process.exit();
    }
};
