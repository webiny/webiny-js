import "tsx/esm";
import { requireConfigWithExecute } from "./utils/requireConfig.js";
import { serializeError } from "serialize-error";

const sendError = (err: Error) => {
    const response = {
        type: "error",
        error: serializeError(err)
    };

    process.send!(response);
};

const sendSuccess = () => {
    const response = {
        type: "success",
        error: null
    };

    process.send!(response);
};

process.on("uncaughtException", err => {
    sendError(err);
});

process.on("unhandledRejection", reason => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    sendError(err);
});

const workerData = JSON.parse(process.argv[2]);

const { package: pkg, env, variant, region, debug } = workerData;
const options = {
    cwd: pkg.paths.packageFolder,
    env,
    variant,
    region,
    debug
};

const config = await requireConfigWithExecute(pkg.paths.webinyConfigFile, {
    options
});

const hasBuild = config.commands && typeof config.commands.build === "function";
if (!hasBuild) {
    throw new Error("Build command not found.");
}

await config.commands.build(options);

sendSuccess();
