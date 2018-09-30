// @flow
import * as React from "react";

export type ImageEditor = {
    removeFilter: Function,
    applyFilter: Function,
    startDrawingMode: Function,
    stopDrawingMode: Function,
    getCropzoneRect: Function,
    crop: Function,
    undo: Function,
    redo: Function,
    on: Function
};

export type ImageEditorTool = {
    name: string,
    icon: ({ imageEditor: ImageEditor, enableTool: Function }) => React.Element<any>,
    subMenu?: ({ imageEditor: ImageEditor, clearTool: Function }) => React.Node
};
