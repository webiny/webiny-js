import { CliContext } from "@webiny/cli/types";
import * as fs from "fs";
import * as path from "path";

const handlersPaths = [
    [
        require.resolve("@webiny/handler-aws-ddb-api-graphql/build/handler"),
        path.join("code", "graphql", "build", "handler.js")
    ]
];

export const generateCommonHandlers = {
    type: "hook-before-build",
    name: "hook-before-build-generate-common-handlers",
    async hook({ projectApplication }, context: CliContext) {
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
