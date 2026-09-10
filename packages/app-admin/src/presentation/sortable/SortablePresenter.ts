import { makeAutoObservable, runInAction } from "mobx";
import {
    draggable,
    dropTargetForElements
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
    attachClosestEdge,
    extractClosestEdge
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { SortablePresenter as Abstraction } from "./abstractions.js";

function toSortableEdge(edge: string | null): Abstraction.Edge | null {
    if (edge === "top" || edge === "bottom") {
        return edge;
    }
    return null;
}

function getIndex(data: Record<string | symbol, unknown>): number | null {
    const index = data["index"];
    if (typeof index === "number") {
        return index;
    }
    return null;
}

function getType(data: Record<string | symbol, unknown>): string | null {
    const type = data["type"];
    if (typeof type === "string") {
        return type;
    }
    return null;
}

class SortablePresenterImpl implements Abstraction.Interface {
    private draggingIndex: number | null = null;
    private overIndex: number | null = null;
    private closestEdge: Abstraction.Edge | null = null;
    private cleanups = new Map<number, () => void>();
    private config: Abstraction.Config | null = null;

    constructor() {
        makeAutoObservable<SortablePresenterImpl, "cleanups" | "config">(this, {
            cleanups: false,
            config: false
        });
    }

    init(config: Abstraction.Config): void {
        this.config = config;
    }

    getItemProps(index: number): Abstraction.ItemProps {
        return {
            ref: (element: HTMLElement | null) => {
                this.registerDropTarget(index, element);
            },
            handleRef: (element: HTMLElement | null) => {
                this.registerDraggable(index, element);
            },
            isDragging: this.draggingIndex === index,
            isOver: this.overIndex === index && this.draggingIndex !== index,
            closestEdge: this.getVisibleEdge(index)
        };
    }

    dispose(): void {
        for (const cleanup of this.cleanups.values()) {
            cleanup();
        }
        this.cleanups.clear();
        this.draggingIndex = null;
        this.overIndex = null;
        this.closestEdge = null;
    }

    private get type(): string {
        return this.config!.type;
    }

    private isOwnDrag(data: Record<string | symbol, unknown>): boolean {
        return getType(data) === this.type;
    }

    private getVisibleEdge(index: number): Abstraction.Edge | null {
        if (
            this.overIndex !== index ||
            this.draggingIndex === index ||
            this.draggingIndex === null
        ) {
            return null;
        }
        const edge = this.closestEdge;
        if (edge === "top" && this.draggingIndex === index - 1) {
            return null;
        }
        if (edge === "bottom" && this.draggingIndex === index + 1) {
            return null;
        }
        return edge;
    }

    private clearDropState(): void {
        this.draggingIndex = null;
        this.overIndex = null;
        this.closestEdge = null;
    }

    private computeDestination(
        fromIndex: number,
        toIndex: number,
        edge: Abstraction.Edge | null
    ): number {
        let destinationIndex = toIndex;
        if (edge === "bottom") {
            destinationIndex = fromIndex < toIndex ? toIndex : toIndex + 1;
        } else if (edge === "top") {
            destinationIndex = fromIndex > toIndex ? toIndex : toIndex - 1;
        }
        return destinationIndex;
    }

    private registerDropTarget(index: number, element: HTMLElement | null): void {
        const key = index * 2;
        const existing = this.cleanups.get(key);
        if (existing) {
            existing();
            this.cleanups.delete(key);
        }

        if (!element) {
            return;
        }

        const cleanup = dropTargetForElements({
            element,
            canDrop: ({ source }) => {
                return this.isOwnDrag(source.data) && getIndex(source.data) !== index;
            },
            getData: ({ input }) => {
                return attachClosestEdge(
                    { index, type: this.type },
                    { element, input, allowedEdges: ["top", "bottom"] }
                );
            },
            onDragEnter: ({ self, source }) => {
                if (!this.isOwnDrag(source.data)) {
                    return;
                }
                runInAction(() => {
                    this.overIndex = index;
                    this.closestEdge = toSortableEdge(extractClosestEdge(self.data));
                });
            },
            onDrag: ({ self, source }) => {
                if (!this.isOwnDrag(source.data)) {
                    return;
                }
                runInAction(() => {
                    this.overIndex = index;
                    this.closestEdge = toSortableEdge(extractClosestEdge(self.data));
                });
            },
            onDragLeave: ({ source }) => {
                if (!this.isOwnDrag(source.data)) {
                    return;
                }
                runInAction(() => {
                    if (this.overIndex === index) {
                        this.overIndex = null;
                        this.closestEdge = null;
                    }
                });
            },
            onDrop: ({ self, source }) => {
                if (!this.isOwnDrag(source.data)) {
                    return;
                }

                const fromIndex = getIndex(source.data);
                const toIndex = getIndex(self.data);
                const edge = toSortableEdge(extractClosestEdge(self.data));

                runInAction(() => {
                    this.clearDropState();
                });

                if (fromIndex === null || toIndex === null || !this.config) {
                    return;
                }

                const destinationIndex = this.computeDestination(fromIndex, toIndex, edge);
                if (destinationIndex !== fromIndex) {
                    this.config.onReorder(fromIndex, destinationIndex);
                }
            }
        });

        this.cleanups.set(key, cleanup);
    }

    private registerDraggable(index: number, element: HTMLElement | null): void {
        const key = index * 2 + 1;
        const existing = this.cleanups.get(key);
        if (existing) {
            existing();
            this.cleanups.delete(key);
        }

        if (!element) {
            return;
        }

        const container = element.closest("[data-sortable-item]") as HTMLElement | null;
        if (!container) {
            return;
        }

        const cleanup = draggable({
            element: container,
            dragHandle: element,
            getInitialData: () => ({ index, type: this.type }),
            onDragStart: () => {
                runInAction(() => {
                    this.draggingIndex = index;
                });
            },
            onDrop: () => {
                runInAction(() => {
                    this.clearDropState();
                });
            }
        });

        this.cleanups.set(key, cleanup);
    }
}

export const SortablePresenter = Abstraction.createImplementation({
    implementation: SortablePresenterImpl,
    dependencies: []
});
