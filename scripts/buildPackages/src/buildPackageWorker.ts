import "tsx/esm";
import path from "path";
import { serializeError } from "serialize-error";
import { pathToFileURL } from "url";

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

const buildOverrides = JSON.parse(process.argv[2]);
const safeReplace = process.argv.includes("--safe-replace");
const webinyConfigPath = pathToFileURL(path.join(process.cwd(), "webiny.config.js")).href;

try {
    const { default: webinyConfigTs } = await import(webinyConfigPath);

    await webinyConfigTs.commands.build({ overrides: buildOverrides, safeReplace });

    sendSuccess();
} catch (ex) {
    sendError(ex);
}
