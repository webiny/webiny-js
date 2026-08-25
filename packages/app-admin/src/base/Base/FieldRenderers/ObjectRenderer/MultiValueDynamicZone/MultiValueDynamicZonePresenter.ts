import type {
    ISortablePresenter,
    ISortableItemProps
} from "~/presentation/sortable/abstractions.js";
import { SortablePresenter } from "~/presentation/sortable/abstractions.js";
import {
    MultiValueDynamicZonePresenter as Abstraction,
    type IMultiValueDynamicZonePresenter,
    type IMultiValueDynamicZonePresenterConfig
} from "./abstractions.js";

class MultiValueDynamicZonePresenterImpl implements IMultiValueDynamicZonePresenter {
    private sortable: ISortablePresenter;

    constructor(sortable: ISortablePresenter) {
        this.sortable = sortable;
    }

    init(config: IMultiValueDynamicZonePresenterConfig): void {
        this.sortable.init({ type: config.type, onReorder: config.onReorder });
    }

    getItemProps(index: number): ISortableItemProps {
        return this.sortable.getItemProps(index);
    }

    dispose(): void {
        this.sortable.dispose();
    }
}

export const MultiValueDynamicZonePresenter = Abstraction.createImplementation({
    implementation: MultiValueDynamicZonePresenterImpl,
    dependencies: [SortablePresenter]
});
