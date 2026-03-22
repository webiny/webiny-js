import type { Box } from "./Box.js";

type DropPosition = number | null;

export interface DropZoneProximity {
    box: Box;
    position: DropPosition;
}

interface DropzoneEntry {
    id: string;
    box: Box;
    canAccept?: () => boolean;
    onProximityChange: (proximity: DropZoneProximity | null) => void;
}

export class DropZoneManager {
    private zones = new Map<string, DropzoneEntry>();
    private currentTargetId: string | null = null;
    private currentPosition: DropPosition = null;
    private animationFrame: number | null = null;
    private currentBox: Box | null = null;

    constructor(private mouse: { x: number; y: number }) {}

    register(entry: DropzoneEntry) {
        if (entry.id === "root") {
            return;
        }

        this.zones.set(entry.id, entry);
    }

    unregister(id: string) {
        this.zones.delete(id);
    }

    start() {
        const runDropzoneLoop = () => {
            this.tick();
            this.animationFrame = requestAnimationFrame(runDropzoneLoop);
        };
        this.animationFrame = requestAnimationFrame(runDropzoneLoop);
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    getLastMatchedPosition() {
        if (!this.currentBox) {
            return null;
        }

        return {
            parentId: this.currentBox.parentId,
            slot: this.currentBox.parentSlot,
            index: this.currentBox.parentIndex + (this.currentPosition ?? 0)
        };
    }

    tick() {
        const scrollYOffset = this.getScrollOffset();
        const threshold = 10;
        const mouseX = this.mouse.x;
        const mouseY = this.mouse.y + scrollYOffset;

        let matchedId: string | null = null;
        let matchedPosition: DropPosition = null;
        let matchedBox: Box | null = null;

        // Collect all candidate matches with their canAccept callback.
        const candidates: { id: string; box: Box; position: number; canAccept?: () => boolean }[] =
            [];

        for (const [id, { box, canAccept }] of this.zones) {
            const isWithinX = mouseX >= box.left && mouseX <= box.right;

            if (!isWithinX) {
                continue;
            }

            if (Math.abs(mouseY - box.top) <= threshold) {
                candidates.push({ id, box, position: 0, canAccept });
            }

            if (Math.abs(mouseY - box.bottom) <= threshold) {
                candidates.push({ id, box, position: 1, canAccept });
            }
        }

        if (candidates.length > 0) {
            // Sort by depth descending (deepest first).
            const uniqueDepths = [...new Set(candidates.map(c => c.box.depth))].sort(
                (a, b) => b - a
            );

            if (uniqueDepths.length === 1) {
                // Single depth — pick the first candidate that can accept.
                const winner = candidates.find(c => !c.canAccept || c.canAccept()) ?? null;
                if (winner) {
                    matchedId = winner.id;
                    matchedPosition = winner.position;
                    matchedBox = winner.box;
                }
            } else {
                // Use X position to select depth band.
                let rangeLeft = Infinity;
                let rangeRight = -Infinity;
                for (const c of candidates) {
                    rangeLeft = Math.min(rangeLeft, c.box.left);
                    rangeRight = Math.max(rangeRight, c.box.right);
                }

                const centerX = (rangeLeft + rangeRight) / 2;
                const halfWidth = (rangeRight - rangeLeft) / 2;

                // 0 at center, 1 at edges.
                const distFromCenter = halfWidth > 0 ? Math.abs(mouseX - centerX) / halfWidth : 0;

                // Map distance to depth index: center → 0 (deepest), edges → last (shallowest).
                const startIndex = Math.min(
                    Math.floor(distFromCenter * uniqueDepths.length),
                    uniqueDepths.length - 1
                );

                // Try the selected band, then search outward (shallower), then inward (deeper).
                const findWinnerAtDepth = (depth: number) =>
                    candidates.find(c => c.box.depth === depth && (!c.canAccept || c.canAccept()));

                let winner = findWinnerAtDepth(uniqueDepths[startIndex]);

                if (!winner) {
                    // Search shallower bands first, then deeper.
                    for (let i = startIndex + 1; i < uniqueDepths.length; i++) {
                        winner = findWinnerAtDepth(uniqueDepths[i]);
                        if (winner) break;
                    }
                }

                if (!winner) {
                    // Search deeper bands.
                    for (let i = startIndex - 1; i >= 0; i--) {
                        winner = findWinnerAtDepth(uniqueDepths[i]);
                        if (winner) break;
                    }
                }

                if (winner) {
                    matchedId = winner.id;
                    matchedPosition = winner.position;
                    matchedBox = winner.box;
                }
            }
        }

        if (matchedId !== this.currentTargetId || matchedPosition !== this.currentPosition) {
            this.currentTargetId = matchedId;
            this.currentPosition = matchedPosition;
            this.currentBox = matchedBox;

            for (const [id, entry] of this.zones) {
                const isTarget = id === matchedId;
                entry.onProximityChange(
                    isTarget ? { box: matchedBox!, position: matchedPosition } : null
                );
            }
        }
    }

    private getScrollOffset() {
        const container = document.getElementById("preview-container");
        if (!container) {
            return 0;
        }

        return container.scrollTop;
    }
}
