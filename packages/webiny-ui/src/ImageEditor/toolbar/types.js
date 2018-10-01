// @flow
import * as React from "react";
import type TuiImageEditor from "tui-image-editor";

export type ImageEditor = TuiImageEditor;

export type ImageEditorTool = {
    name: string,
    icon: ({
        imageEditor: TuiImageEditor,
        resizeCanvas: Function,
        enableTool: Function
    }) => React.Element<any>,
    subMenu?: ({
        imageEditor: TuiImageEditor,
        resizeCanvas: Function,
        clearTool: Function
    }) => React.Node
};
