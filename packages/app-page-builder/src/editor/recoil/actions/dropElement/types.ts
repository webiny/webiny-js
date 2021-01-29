import { DragObjectWithTypeWithTarget } from "@webiny/app-page-builder/editor/components/Droppable";

export type DropElementActionArgsType = {
    source: DragObjectWithTypeWithTarget;
    target: {
        id: string;
        type: string;
        path?: string;
        position: number;
    };
};
