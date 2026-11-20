import { makeDecoratable } from "@webiny/react-composition";
import type { ComponentManifest } from "@webiny/website-builder-sdk";

export interface CanDragElementParams {
    elementId: string;
    componentManifest: ComponentManifest | undefined;
}

/**
 * Whether an element on the canvas can be picked up and dragged (the canvas's element overlays
 * only; the Navigator tree still reads the manifest's `canDrag`, and a `MoveElement` command
 * handler can refuse a move from anywhere). By default, the component manifest's `canDrag` decides. Decoratable, so an extension can stop the drag of an element it
 * doesn't own (for example, a page's first box), which a manifest can't express:
 *
 * ```tsx
 * const LockedDrag = useCanDragElement.createDecorator(original => params => {
 *     const canDrag = original(params);
 *     const locked = useIsLocked(params.elementId);
 *     return canDrag && !locked;
 * });
 * ```
 */
export const useCanDragElement = makeDecoratable((params: CanDragElementParams): boolean => {
    return params.componentManifest?.canDrag !== false;
});
