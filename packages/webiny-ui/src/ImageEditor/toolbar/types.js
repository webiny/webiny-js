// @flow
import * as React from "react";

export type ImageEditorTool = {
    name: string,
    icon: ({
        canvas: any,
        activateTool: Function
    }) => React.Element<any>,
    renderForm?: ({
        canvas: any,
        renderApplyCancel: Function
    }) => React.Node
};
