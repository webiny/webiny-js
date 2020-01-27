import * as React from "react";

interface RenderFormParams {
    canvas: any;
    renderApplyCancel: Function;
    options?: { [key: string]: any };
}

export interface ImageEditorTool {
    name: string;
    apply?: Function;
    cancel?: Function;
    onActivate?: ({ options, canvas }) => void;
    icon: ({ activateTool: Function }) => React.ReactElement<any>;
    renderForm?: (params: RenderFormParams) => React.ReactNode;
}
