import "tsx/esm";
import { Properties, toObject } from "@webiny/react-properties";
import debounce from "debounce";
import React from "react";
import { createRoot } from "react-dom/client";
import { serializeError } from "serialize-error";

// @ts-expect-error jsdom types are messing up with the repo, so they're disabled in the root package.json.
import { JSDOM } from "jsdom";
import type { RenderConfigWorkerMessageDto, RenderConfigParamsDto } from "./renderConfig.js";
import { ProjectModel } from "~/models/ProjectModel.js";

const sendError = (err: Error) => {
    const message: RenderConfigWorkerMessageDto = {
        type: "error",
        error: serializeError(err),
        data: null
    };

    process.send!(message);
};

const sendSuccess = (data: Record<string, any> = {}) => {
    const message: RenderConfigWorkerMessageDto = {
        type: "success",
        error: null,
        data
    };

    process.send!(message);
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

const { window } = new JSDOM(`<div id="root"/>`);

global.window = window;
global.document = window.document;

const root = window.document.getElementById("root");

const reactRoot = createRoot(root);

reactRoot.render(
    <Properties onChange={onChange}>
        <Extensions />
    </Properties>
);
