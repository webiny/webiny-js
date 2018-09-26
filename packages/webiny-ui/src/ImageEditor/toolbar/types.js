// @flow
import * as React from "react";

export type ImageEditor = Object;

export type ImageEditorTool = {
    name: string,
    icon: React.Node,
    onClick: Function,
    subMenu?: ({ imageEditor: ImageEditor, clearTool: Function }) => React.Node
};
