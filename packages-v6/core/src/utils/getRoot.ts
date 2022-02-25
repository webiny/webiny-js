import findUp from "find-up";
import { dirname } from "path";

const projectConfigs = ["webiny.config.ts"];

export function getRoot() {
    const root = findUp.sync(projectConfigs, { cwd: process.cwd() });
    if (root) {
        return dirname(root).replace(/\\/g, "/");
    }

    throw new Error("Couldn't detect Webiny project.");
}
