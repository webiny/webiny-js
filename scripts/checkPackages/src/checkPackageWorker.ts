import "tsx/esm";
import { serializeError } from "serialize-error";
import { tsCompile } from "@webiny/build-tools/packages/buildPackage/tsCompile.js";

const sendError = (err: Error) => {
    process.send!({ type: "error", error: serializeError(err) });
};

const sendSuccess = () => {
    process.send!({ type: "success", error: null });
};

process.on("uncaughtException", err => {
    sendError(err);
});

process.on("unhandledRejection", reason => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    sendError(err);
});

try {
    await tsCompile({ cwd: process.cwd(), overrides: {}, checkOnly: true });
    sendSuccess();
} catch (ex: any) {
    sendError(ex);
}
