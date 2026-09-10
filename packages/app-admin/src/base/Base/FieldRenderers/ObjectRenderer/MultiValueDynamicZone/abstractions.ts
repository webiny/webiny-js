import { createAbstraction } from "@webiny/feature/admin";
import type { ISortableItemProps } from "~/presentation/sortable/abstractions.js";

export interface IMultiValueDynamicZonePresenterConfig {
    type: string;
    onReorder: (fromIndex: number, toIndex: number) => void;
}

export interface IMultiValueDynamicZonePresenter {
    init(config: IMultiValueDynamicZonePresenterConfig): void;
    getItemProps(index: number): ISortableItemProps;
    dispose(): void;
}

export const MultiValueDynamicZonePresenter = createAbstraction<IMultiValueDynamicZonePresenter>(
    "MultiValueDynamicZonePresenter"
);

export namespace MultiValueDynamicZonePresenter {
    export type Interface = IMultiValueDynamicZonePresenter;
    export type Config = IMultiValueDynamicZonePresenterConfig;
}
