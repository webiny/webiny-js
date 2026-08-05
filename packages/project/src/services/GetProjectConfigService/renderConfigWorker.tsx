import "tsx/esm";
import fs from "fs";
import path from "path";
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

const projectRoot = project.paths.rootFolder.toString();
const featureFlagsFile = ["webiny.features.tsx", "webiny.features.ts"]
    .map(name => path.join(projectRoot, name))
    .find(p => fs.existsSync(p));

let FeatureFlagsComponent: React.ComponentType | null = null;
if (featureFlagsFile) {
    const featureFlagsModule = await import(toImportSpecifier(featureFlagsFile));
    if (featureFlagsModule.default) {
        FeatureFlagsComponent = featureFlagsModule.default;
    }
}

const { Extensions } = await import(
    toImportSpecifier(project.paths.webinyConfigBaseFile.toString())
);

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
    sendSuccess(toObject(value));
    process.exit(0);
});

const { window } = new JSDOM(`<div id="root"/>`);

(global as any).window = window;

(global as any).document = window.document;

const root = window.document.getElementById("root")!;

const reactRoot = createRoot(root);

reactRoot.render(
    <WcpProjectLicenseProvider>
        <FeatureFlagsProvider>
            <EnvProvider>
                <ProductionEnvironmentsCollector>
                    <AsyncProperties onChange={onChange}>
                        {FeatureFlagsComponent ? <FeatureFlagsComponent /> : null}
                        <Extensions />
                    </AsyncProperties>
                </ProductionEnvironmentsCollector>
            </EnvProvider>
        </FeatureFlagsProvider>
    </WcpProjectLicenseProvider>
);
