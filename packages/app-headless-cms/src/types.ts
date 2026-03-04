import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { DragSourceMonitor, XYCoord } from "react-dnd";
import type { DragDropManager, Identifier, Listener, Unsubscribe } from "dnd-core";

export type * from "@webiny/app-headless-cms-common/types/index.js";
export { isLayoutDescriptor } from "@webiny/app-headless-cms-common/types/index.js";

/***
 * ###### TABLE ########
 */
export type EntryTableItem = RecordTableRow<CmsContentEntry>;

export type TableItem = FolderTableRow | EntryTableItem;

export declare class DragSourceMonitorImpl<DragObject = unknown, DropResult = unknown>
    implements DragSourceMonitor<DragObject, DropResult>
{
    private internalMonitor;
    private sourceId;
    constructor(manager: DragDropManager);
    receiveHandlerId(sourceId: Identifier | null): void;
    getHandlerId(): Identifier | null;
    subscribeToStateChange(
        listener: Listener,
        options?: {
            handlerIds: Identifier[] | undefined;
        }
    ): Unsubscribe;
    subscribeToOffsetChange(listener: Listener): Unsubscribe;
    canDrag(): boolean;
    isDragging(): boolean;
    getItemType(): Identifier | null;
    getItem<T = DragObject>(): T;
    getDropResult<T = DropResult>(): T | null;
    didDrop(): boolean;
    getInitialClientOffset(): XYCoord | null;
    getInitialSourceClientOffset(): XYCoord | null;
    getClientOffset(): XYCoord | null;
    getDifferenceFromInitialOffset(): XYCoord | null;
    getSourceClientOffset(): XYCoord | null;
    getTargetIds(): Identifier[];
}
