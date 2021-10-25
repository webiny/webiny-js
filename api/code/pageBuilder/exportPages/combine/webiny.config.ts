import { buildFunction, watchFunction } from "@webiny/project-utils";

export default {
    commands: {
        build: (options, context) =>
            buildFunction(
                {
                    ...options,
                    output: {
                        path: __dirname + "/build",
                        filename: "handler.js"
                    },
                    entry: __dirname + "/src/index.ts"
                },
                context
            ),
        watch: watchFunction
    }
};
