// @flow
import * as React from "react";

export type ImageEditorTool = {
    name: string,
    icon: ({
        apply: Function,
        canvas: any,
        activateTool: Function
    }) => React.Element<any>,
    subMenu?: ({
        apply: Function,
        canvas: any,
        deactivateTool: Function
    }) => React.Node
};
