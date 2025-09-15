import { Properties, toObject } from "@webiny/react-properties";
import debounce from "debounce";
import React from "react";
import { createRoot } from "react-dom/client";

// @ts-expect-error jsdom types are messing up with the repo, so they're disabled in the root package.json.
import { JSDOM } from "jsdom";
import { type RenderConfigParamsDto } from "./renderConfig.js";
import { ProjectModel } from "~/models/ProjectModel.js";

const { project: projectModelDto } = JSON.parse(process.argv[2]) as RenderConfigParamsDto;
const project = ProjectModel.fromDto(projectModelDto);

//eslint-disable-next-line import/dynamic-import-chunkname
const { default: WebinyConfig } = await import(project.paths.webinyConfigFile.toString());

const onChange = debounce((value: any) => {
    if (process.send) {
        process.send(toObject(value));
    }

    process.exit();
});

const { window } = new JSDOM(`<div id="root"/>`);

global.window = window;
global.document = window.document;

const root = window.document.getElementById("root");

const reactRoot = createRoot(root);

reactRoot.render(
    <Properties onChange={onChange}>
        <WebinyConfig />
    </Properties>
);
