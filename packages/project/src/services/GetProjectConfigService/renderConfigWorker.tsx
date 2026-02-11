import "tsx/esm";
import { Properties, toObject } from "@webiny/react-properties";
import debounce from "debounce";
import React from "react";
import Renderer from "react-test-renderer";
import { serializeError } from "serialize-error";
import type { RenderConfigWorkerMessageDto, RenderConfigParamsDto } from "./renderConfig.js";
import { ProjectModel } from "~/models/ProjectModel.js";
import { EnvProvider } from "./EnvContext.js";
import { WcpProjectLicenseProvider } from "./WcpProjectLicenseContext.js";

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

const { Extensions } = await import(project.paths.webinyConfigBaseFile.toString());

const onChange = debounce((value: any) => {
    sendSuccess(toObject(value));
    process.exit(0);
});

Renderer.create(
    <WcpProjectLicenseProvider>
        <EnvProvider>
            <Properties onChange={onChange}>
                <Extensions />
            </Properties>
        </EnvProvider>
    </WcpProjectLicenseProvider>
);
