import * as fs from "fs";
import * as path from "path";
import { getHandlerPath } from "~/utils";

const COMMON_HANDLERS_PATHS = [
    ["fileManager", "download"],
    ["fileManager", "manage"],
    ["fileManager", "transform"]
];

export const generateCommonHandlers = {
    type: "hook-before-build",
    name: "hook-before-build-generate-common-handlers",
    async hook({ projectApplication }: Record<string, any>) {
        for (let i = 0; i < COMMON_HANDLERS_PATHS.length; i++) {
            const current = COMMON_HANDLERS_PATHS[i];

            const from = getHandlerPath("common", "api", ...current, "handler.js");
            const to = path.join(
                projectApplication.paths.workspace,
                ...current,
                "build",
                "handler.js"
            );

            if (!fs.existsSync(path.dirname(to))) {
                fs.mkdirSync(path.dirname(to), { recursive: true });
            }

            fs.copyFileSync(from, to);
        }
    }
};
