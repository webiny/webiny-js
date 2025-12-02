import "tsx/esm";
import path from "path";
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

const buildOverrides = JSON.parse(process.argv[2]);
const webinyConfigPath = path.join(process.cwd(), "webiny.config.js");

const { default: webinyConfigTs } = await import(webinyConfigPath);

await webinyConfigTs.commands.build({ overrides: buildOverrides });

sendSuccess();
