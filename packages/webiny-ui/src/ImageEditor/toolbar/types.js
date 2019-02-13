// @flow
import * as React from "react";

export type ImageEditorTool = {
    name: string,
    apply?: Function,
    cancel?: Function,
    icon: ({
        canvas: any,
        activateTool: Function,
        options?: Object
    }) => React.Element<any>,
    renderForm?: ({
        canvas: any,
        renderApplyCancel: Function,
        options?: Object
    }) => React.Node
};
