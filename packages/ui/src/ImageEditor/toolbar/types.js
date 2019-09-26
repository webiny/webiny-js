// @flow
import * as React from "react";

export type ImageEditorTool = {
    name: string,
    apply?: Function,
    cancel?: Function,
    onActivate?: { options: Object, canvas: any },
    icon: ({
        activateTool: Function
    }) => React.Element<any>,
    renderForm?: ({
        canvas: any,
        renderApplyCancel: Function,
        options?: Object
    }) => React.Node
};
