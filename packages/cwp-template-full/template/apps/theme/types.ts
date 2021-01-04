import React from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { Plugin } from "@webiny/plugins/types";
import { BlockType } from "./richTextEditor/dataRenderer";

export type RTEDataRendererPlugin = Plugin & {
    type: "rte-data-renderer";
    outputType: "jsx" | "html";
    render(data: OutputBlockData[]): React.ReactNode;
};

export type RTEDataBlockRendererPlugin = Plugin & {
    type: "rte-data-block-renderer";
    blockType: BlockType;
    render(block: OutputBlockData): React.ReactElement;
};
