import fs from "fs";
import path from "path";
import { cli } from "@webiny/cli";
import { getHandlerPath } from "./getHandlerPath";

export type HandlerType = "common" | "ddb" | "ddb-es";
export type App = "api" | "core" | "website";

export const generateHandlers = (type: HandlerType, app: App, paths: string[][]) => {
    const hook = async ({ projectApplication }: Record<string, any>) => {
        for (let i = 0; i < paths.length; i++) {
            const current = paths[i];

            const from = getHandlerPath(type, app, ...current, "handler.js");
            const to = path.join(
                projectApplication.paths.absolute,
                ...current,
                "build",
                "handler.js"
            );

            if (!fs.existsSync(from)) {
                cli.debug(`Prebuilt handler not found at %s.`, from.replace(cli.project.root, ""));
                continue;
            }

            if (!fs.existsSync(path.dirname(to))) {
                fs.mkdirSync(path.dirname(to), { recursive: true });
            }

            fs.copyFileSync(from, to);
        }
    };

    return [
        { type: "hook-before-build", hook },
        { type: "hook-before-watch", hook }
    ];
};
