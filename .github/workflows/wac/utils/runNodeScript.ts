import { addToOutputs } from "./addToOutputs.js";

interface RunNodeScriptOptions {
    outputAs?: string;
    // When true, `params` is inserted into the shell command as-is (not wrapped
    // in single quotes). Use this when `params` already contains the desired
    // shell quoting — for example, when forwarding an env var with `"$MY_VAR"`
    // to avoid the script-injection footgun of interpolating attacker-
    // controlled `${{ … }}` expressions directly into a shell command.
    rawParams?: boolean;
}

export const runNodeScript = (
    name: string,
    params: string = "",
    options: RunNodeScriptOptions = {}
) => {
    const scriptPath = `.github/workflows/wac/utils/runNodeScripts/${name}.js`;
    const quotedParams = options.rawParams ? params : `'${params}'`;
    let cmd = `node ${scriptPath} ${quotedParams}`;
    if (options.outputAs) {
        cmd = addToOutputs(options.outputAs, `$(${cmd})`);
    }

    return cmd;
};
