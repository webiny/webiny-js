import { createAbstraction } from "@webiny/feature/admin";

export type SortableEdge = "top" | "bottom";

export interface ISortableItemProps {
    ref: (element: HTMLElement | null) => void;
    handleRef: (element: HTMLElement | null) => void;
    isDragging: boolean;
    isOver: boolean;
    closestEdge: SortableEdge | null;
}

export interface ISortablePresenterConfig {
    type: string;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

export interface ISortablePresenter {
    init(config: ISortablePresenterConfig): void;
    getItemProps(index: number): ISortableItemProps;
    dispose(): void;
}

export const SortablePresenter = createAbstraction<ISortablePresenter>("SortablePresenter");

export namespace SortablePresenter {
    export type Interface = ISortablePresenter;
    export type Config = ISortablePresenterConfig;
    export type ItemProps = ISortableItemProps;
    export type Edge = SortableEdge;
}
