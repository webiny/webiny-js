import { CliContext } from "@webiny/cli/types";
import * as fs from "fs";
import * as path from "path";

const handlersPaths = [
    [
        require.resolve("@webiny/handler-aws-ddb-es-core-ddb-to-es/build/handler"),
        path.join("code", "dynamoToElastic", "build", "handler.js")
    ]
];

export const generateDdbToEsHandler = {
    type: "hook-before-build",
    name: "hook-before-build-generate-ddb-es-handlers",
    async hook({ projectApplication }, context: CliContext) {
        context.info("Generating system AWS Lambda functions code...");

        for (let i = 0; i < handlersPaths.length; i++) {
            const [from, relativeTo] = handlersPaths[i];

            const to = path.join(projectApplication.paths.workspace, relativeTo);
            if (!fs.existsSync(to)) {
                fs.mkdirSync(path.dirname(to), { recursive: true });
            }

            fs.copyFileSync(from, to);
        }

    }
};
