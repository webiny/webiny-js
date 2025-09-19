import type React from "react";

export type ToolbarTool = "crop" | "flip" | "rotate" | "filter";

interface RenderFormParams {
    canvas: React.RefObject<HTMLCanvasElement | null>;
    image: HTMLImageElement;
    renderApplyCancel?: () => void;
    options?: { [key: string]: any };
}

interface OnActivateParams {
    options: any;
    canvas: React.RefObject<HTMLCanvasElement | null>;
}

interface IconParams {
    activateTool: (tool: ToolbarTool) => void;
}

interface ApplyParams {
    canvas: React.RefObject<HTMLCanvasElement | null>;
}

interface CancelParams {
    canvas: React.RefObject<HTMLCanvasElement | null>;
}

export interface ImageEditorTool {
    name: string;
    apply?: (params: ApplyParams) => void;
    cancel?: (params: CancelParams) => void;
    onActivate?: (params: OnActivateParams) => void;
    icon: (params: IconParams) => React.ReactElement<any>;
    renderForm?: (params: RenderFormParams) => React.ReactNode;
}
