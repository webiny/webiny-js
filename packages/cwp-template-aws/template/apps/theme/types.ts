import React from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { Plugin } from "@webiny/plugins/types";

export type RTEDataRendererPlugin = Plugin & {
    type: "rte-data-renderer";
    outputType: string;
    render(data: OutputBlockData[]): React.ReactNode;
};
export type RTEDataBlockRendererPlugin = Plugin & {
    type: "rte-data-block-renderer";
    outputType: string;
    blockType: string;
    render(block: OutputBlockData): React.ReactElement;
};
