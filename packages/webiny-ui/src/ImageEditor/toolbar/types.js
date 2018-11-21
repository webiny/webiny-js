// @flow
import * as React from "react";

export type ImageEditorTool = {
    name: string,
    apply?: Function,
    cancel?: Function,
    icon: ({
        canvas: any,
        activateTool: Function
    }) => React.Element<any>,
    renderForm?: ({
        canvas: any,
        renderApplyCancel: Function
    }) => React.Node
};
