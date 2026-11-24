import { addToOutputs } from "./addToOutputs.js";
import { nodeScriptPath } from "./nodeScriptPath.js";

interface RunNodeScriptOptions {
    outputAs?: string;
}

export const runNodeScript = (
    name: string,
    params: string = "",
    options: RunNodeScriptOptions = {}
) => {
    let cmd = `node ${nodeScriptPath(name)} '${params}'`;
    if (options.outputAs) {
        cmd = addToOutputs(options.outputAs, `$(${cmd})`);
    }

    return cmd;
};
