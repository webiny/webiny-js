import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";

export type DropElementActionArgsType = {
    source: DragObjectWithTypeWithTargetType;
    target: {
        id: string;
        type: string;
        path?: string;
        position: number;
    };
};
