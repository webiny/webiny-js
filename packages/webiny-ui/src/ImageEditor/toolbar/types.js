// @flow
import * as React from "react";

export type ImageEditor = {
    removeFilter: Function,
    applyFilter: Function,
    on: Function
};

export type ImageEditorTool = {
    name: string,
    icon: ({ imageEditor: ImageEditor }) => React.Element<any>,
    subMenu?: ({ imageEditor: ImageEditor, clearTool: Function }) => React.Node
};
