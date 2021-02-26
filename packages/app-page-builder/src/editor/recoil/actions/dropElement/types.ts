import { DragObjectWithTypeWithTarget } from "../../../components/Droppable";

export type DropElementActionArgsType = {
    source: DragObjectWithTypeWithTarget;
    target: {
        id: string;
        type: string;
        path?: string;
        position: number;
    };
};
