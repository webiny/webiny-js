import { vi } from "vitest";
import type { Mock } from "vitest";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";

export interface FakeSortablePresenter extends SortablePresenter.Interface {
    init: Mock<SortablePresenter.Interface["init"]>;
    getItemProps: Mock<SortablePresenter.Interface["getItemProps"]>;
    dispose: Mock<SortablePresenter.Interface["dispose"]>;
    // The config of the first `init` call.
    config(): SortablePresenter.Config;
}

/*
 * A sortable presenter that records its calls. `itemOverrides` changes the item props of one index
 * (for example `{ 1: { isDragging: true } }`); the refs are mocks.
 */
export const createFakeSortable = (
    itemOverrides: Record<number, Partial<SortablePresenter.ItemProps>> = {}
): FakeSortablePresenter => {
    const init = vi.fn<SortablePresenter.Interface["init"]>();
    const dispose = vi.fn<SortablePresenter.Interface["dispose"]>();
    const getItemProps = vi.fn((index: number): SortablePresenter.ItemProps => {
        const base: SortablePresenter.ItemProps = {
            ref: vi.fn(),
            handleRef: vi.fn(),
            isDragging: false,
            isOver: false,
            closestEdge: null
        };
        return { ...base, ...itemOverrides[index] };
    });
    const config = () => {
        return init.mock.calls[0][0];
    };

    return { init, getItemProps, dispose, config };
};
