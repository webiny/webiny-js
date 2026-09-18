import "tsx/esm";
import { AsyncProperties, toObject } from "@webiny/react-properties";
import debounce from "debounce";
import React from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { serializeError } from "serialize-error";
import type { RenderConfigParamsDto, RenderConfigWorkerMessageDto } from "./renderConfig.js";
import { ProjectModel } from "~/models/ProjectModel.js";
import { toImportSpecifier } from "~/utils/index.js";
import { EnvProvider } from "./EnvContext.js";
import { WcpProjectLicenseProvider } from "./WcpProjectLicenseContext.js";
import { FeatureFlagsProvider } from "./FeatureFlagsContext.js";
import { ProductionEnvironmentsCollector } from "./ProductionEnvironmentsContext.js";
import { startTrace } from "~/utils/trace/index.js";
import { traceAsync } from "~/utils/trace/index.js";
import { traceRecorder } from "~/utils/trace/index.js";

// The parent CLI process forwards this worker's stderr when tracing is on.
startTrace("Config render worker");

const sendError = (err: Error) => {
    const message: RenderConfigWorkerMessageDto = {
        type: "error",
        error: serializeError(err),
        data: null
    };

    if (process.send) {
        process.send!(message);
    } else {
        console.error(message);
    }
};

const sendSuccess = (data: Record<string, any> = {}) => {
    const message: RenderConfigWorkerMessageDto = {
        type: "success",
        error: null,
        data
    };

    if (process.send) {
        process.send!(message);
    } else {
        console.log(message);
    }
};

process.on("uncaughtException", err => {
    sendError(err);
    process.exit(1);
});

process.on("unhandledRejection", reason => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    sendError(err);
    process.exit(1);
});

const { project: projectModelDto } = JSON.parse(process.argv[2]) as RenderConfigParamsDto;
const project = ProjectModel.fromDto(projectModelDto);

const { Extensions } = await traceAsync("import webiny.config", () => {
    const configPath = toImportSpecifier(project.paths.webinyConfigBaseFile.toString());

    return import(configPath);
});

const RENDER_TIMEOUT_MS = 30_000;

const timeout = setTimeout(() => {
    sendError(
        new Error(
            `Config rendering timed out after ${RENDER_TIMEOUT_MS}ms. ` +
                `This usually means an <Await> promise never settled.`
        )
    );
    process.exit(1);
}, RENDER_TIMEOUT_MS);

const onChange = debounce((value: any) => {
    clearTimeout(timeout);
    stopRenderTrace();
    sendSuccess(toObject(value));
    process.exit(0);
});

const stopJsdomTrace = traceRecorder.start("create JSDOM");

const { window } = new JSDOM(`<div id="root"/>`);

stopJsdomTrace();

(global as any).window = window;

(global as any).document = window.document;

const root = window.document.getElementById("root")!;

const reactRoot = createRoot(root);

const stopRenderTrace = traceRecorder.start("render config tree");

reactRoot.render(
    <WcpProjectLicenseProvider>
        <FeatureFlagsProvider>
            <EnvProvider>
                <ProductionEnvironmentsCollector>
                    <AsyncProperties onChange={onChange}>
                        <Extensions />
                    </AsyncProperties>
                </ProductionEnvironmentsCollector>
            </EnvProvider>
        </FeatureFlagsProvider>
    </WcpProjectLicenseProvider>
);
