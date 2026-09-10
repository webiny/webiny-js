import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Select } from "~/Select/index.js";
import { Text } from "~/Text/index.js";
import { SectionLabel } from "./SectionLabel.js";
import { DEFAULT_ASPECT_RATIOS } from "./types.js";
import type { ImageEditorCrop, ImageEditorHotspot, ImageEditorImage } from "./types.js";

interface CropHotspotEditorProps {
    image: ImageEditorImage;
    crop: ImageEditorCrop | undefined;
    hotspot: ImageEditorHotspot | undefined;
    /** Currently selected crop shape id ("free" or a preset id). Controlled by the parent. */
    aspectId: string;
    onChangeAspect: (id: string) => void;
    onChangeCrop: (crop: ImageEditorCrop) => void;
    onChangeHotspot: (hotspot: ImageEditorHotspot) => void;
}

/** Crop rectangle in edge positions (0..1): left/top/right/bottom, left<right, top<bottom. */
interface Edges {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const MIN = 0.05;
export const FREE = "free";

/**
 * Infer which crop-shape preset a saved crop corresponds to, by comparing the
 * crop's on-screen (pixel) aspect ratio against the presets. The crop stores only
 * edge insets — not the shape used to draw it — so on reopen we recover the shape
 * here; a crop drawn with a preset matches it closely, while a free crop won't.
 */
export const inferAspectId = (
    crop: ImageEditorCrop | undefined,
    width: number,
    height: number
): string => {
    if (!crop || !width || !height) {
        return FREE;
    }
    const cropWidth = Math.max(0, 1 - (crop.left ?? 0) - (crop.right ?? 0));
    const cropHeight = Math.max(0, 1 - (crop.top ?? 0) - (crop.bottom ?? 0));
    if (cropWidth <= 0 || cropHeight <= 0) {
        return FREE;
    }
    const displayRatio = (cropWidth * width) / (cropHeight * height);
    const match = DEFAULT_ASPECT_RATIOS.find(ar => Math.abs(ar.ratio - displayRatio) < 0.02);
    return match?.id ?? FREE;
};

// Canvas fits within this box (px), preserving the image aspect ratio, so tall
// images don't take up the full screen height.
const MAX_CANVAS_WIDTH = 640;
const MAX_CANVAS_HEIGHT = 460;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const cropToEdges = (crop: ImageEditorCrop | undefined): Edges => ({
    left: clamp01(crop?.left ?? 0),
    top: clamp01(crop?.top ?? 0),
    right: 1 - clamp01(crop?.right ?? 0),
    bottom: 1 - clamp01(crop?.bottom ?? 0)
});

const edgesToCrop = (e: Edges): ImageEditorCrop => ({
    top: e.top,
    left: e.left,
    bottom: 1 - e.bottom,
    right: 1 - e.right
});

// Which edges each handle moves.
const HANDLE_EDGES: Record<Handle, Array<keyof Edges>> = {
    nw: ["top", "left"],
    n: ["top"],
    ne: ["top", "right"],
    e: ["right"],
    se: ["bottom", "right"],
    s: ["bottom"],
    sw: ["bottom", "left"],
    w: ["left"]
};

const CORNER_HANDLES: Handle[] = ["nw", "ne", "se", "sw"];
const EDGE_HANDLES: Handle[] = ["n", "e", "s", "w"];

const clampHotspot = (h: ImageEditorHotspot | undefined, e: Edges): ImageEditorHotspot => ({
    x: Math.min(e.right, Math.max(e.left, h?.x ?? (e.left + e.right) / 2)),
    y: Math.min(e.bottom, Math.max(e.top, h?.y ?? (e.top + e.bottom) / 2)),
    width: h?.width ?? 1,
    height: h?.height ?? 1
});

export const CropHotspotEditor = ({
    image,
    crop,
    hotspot,
    aspectId,
    onChangeAspect,
    onChangeCrop,
    onChangeHotspot
}: CropHotspotEditorProps) => {
    const surfaceRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<
        | { mode: "focal" }
        | { mode: `resize:${Handle}` }
        | { mode: "move"; startPointer: { x: number; y: number }; startEdges: Edges }
        | null
    >(null);

    // Measure the available width so we can fit the canvas into a max box while
    // preserving the image aspect ratio (keeps the box == image aspect, which the
    // pointer coordinate mapping relies on).
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [availWidth, setAvailWidth] = useState(0);

    useLayoutEffect(() => {
        const el = wrapperRef.current;
        if (!el) {
            return;
        }
        const measure = () => setAvailWidth(el.getBoundingClientRect().width);
        measure();
        if (typeof ResizeObserver === "undefined") {
            return;
        }
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const imageRatio = (image.width || 1) / (image.height || 1);
    const surfaceStyle = useMemo<React.CSSProperties>(() => {
        if (availWidth <= 0) {
            return {
                width: "100%",
                aspectRatio: `${image.width || 1} / ${image.height || 1}`,
                maxHeight: `${MAX_CANVAS_HEIGHT}px`
            };
        }
        let width = Math.min(availWidth, MAX_CANVAS_WIDTH);
        let height = width / imageRatio;
        if (height > MAX_CANVAS_HEIGHT) {
            height = MAX_CANVAS_HEIGHT;
            width = height * imageRatio;
        }
        return { width: `${width}px`, height: `${height}px` };
    }, [availWidth, imageRatio, image.width, image.height]);

    const edges = useMemo(() => cropToEdges(crop), [crop]);
    const ratio = DEFAULT_ASPECT_RATIOS.find(ar => ar.id === aspectId)?.ratio ?? null;

    const aspectOptions = useMemo(
        () => [
            { label: "Free", value: FREE },
            ...DEFAULT_ASPECT_RATIOS.map(ar => ({ label: ar.label, value: ar.id }))
        ],
        []
    );

    const toNorm = useCallback((clientX: number, clientY: number) => {
        const rect = surfaceRef.current!.getBoundingClientRect();
        return {
            x: clamp01((clientX - rect.left) / rect.width),
            y: clamp01((clientY - rect.top) / rect.height)
        };
    }, []);

    const commitEdges = useCallback(
        (next: Edges) => {
            onChangeCrop(edgesToCrop(next));
            // Keep the focal point inside the (new) crop.
            onChangeHotspot(clampHotspot(hotspot, next));
        },
        [onChangeCrop, onChangeHotspot, hotspot]
    );

    const resizeFree = (handle: Handle, p: { x: number; y: number }): Edges => {
        const moves = HANDLE_EDGES[handle];
        const next = { ...edges };
        if (moves.includes("left")) {
            next.left = Math.min(p.x, next.right - MIN);
        }
        if (moves.includes("right")) {
            next.right = Math.max(p.x, next.left + MIN);
        }
        if (moves.includes("top")) {
            next.top = Math.min(p.y, next.bottom - MIN);
        }
        if (moves.includes("bottom")) {
            next.bottom = Math.max(p.y, next.top + MIN);
        }
        return next;
    };

    const resizeLocked = (handle: Handle, p: { x: number; y: number }, r: number): Edges => {
        const moves = HANDLE_EDGES[handle];
        // `r` is a display (pixel) aspect ratio, but the crop is stored in normalized
        // image coordinates. Convert so the on-screen crop actually has ratio `r`.
        const rNorm = r / imageRatio;
        // Anchor is the opposite corner (fixed).
        const anchorX = moves.includes("left") ? edges.right : edges.left;
        const anchorY = moves.includes("top") ? edges.bottom : edges.top;
        const dirX = moves.includes("left") ? -1 : 1;
        const dirY = moves.includes("top") ? -1 : 1;

        const maxW = dirX > 0 ? 1 - anchorX : anchorX;
        const maxH = dirY > 0 ? 1 - anchorY : anchorY;

        let w = Math.abs(p.x - anchorX);
        let h = w / rNorm;
        if (h > Math.abs(p.y - anchorY)) {
            // The vertical drag is the limiting axis.
            h = Math.abs(p.y - anchorY);
            w = h * rNorm;
        }
        // Fit inside the image while keeping the ratio.
        w = Math.min(w, maxW);
        h = w / rNorm;
        if (h > maxH) {
            h = maxH;
            w = h * rNorm;
        }
        w = Math.max(w, MIN);
        h = Math.max(h, MIN);

        const next = { ...edges };
        if (dirX > 0) {
            next.left = anchorX;
            next.right = anchorX + w;
        } else {
            next.right = anchorX;
            next.left = anchorX - w;
        }
        if (dirY > 0) {
            next.top = anchorY;
            next.bottom = anchorY + h;
        } else {
            next.bottom = anchorY;
            next.top = anchorY - h;
        }
        return next;
    };

    const moveCrop = (startEdges: Edges, dx: number, dy: number): Edges => {
        const w = startEdges.right - startEdges.left;
        const h = startEdges.bottom - startEdges.top;
        const left = Math.min(Math.max(startEdges.left + dx, 0), 1 - w);
        const top = Math.min(Math.max(startEdges.top + dy, 0), 1 - h);
        return { left, top, right: left + w, bottom: top + h };
    };

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current;
            if (!drag) {
                return;
            }
            const p = toNorm(e.clientX, e.clientY);
            if (drag.mode === "focal") {
                onChangeHotspot(clampHotspot({ x: p.x, y: p.y, width: 1, height: 1 }, edges));
                return;
            }
            if (drag.mode === "move") {
                const dx = p.x - drag.startPointer.x;
                const dy = p.y - drag.startPointer.y;
                commitEdges(moveCrop(drag.startEdges, dx, dy));
                return;
            }
            const handle = drag.mode.slice("resize:".length) as Handle;
            commitEdges(ratio === null ? resizeFree(handle, p) : resizeLocked(handle, p, ratio));
        },
        [toNorm, onChangeHotspot, edges, commitEdges, ratio]
    );

    // Drag inside the crop rectangle repositions the whole crop window.
    const startMoveCrop = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            dragRef.current = {
                mode: "move",
                startPointer: toNorm(e.clientX, e.clientY),
                startEdges: edges
            };
            surfaceRef.current?.setPointerCapture(e.pointerId);
        },
        [toNorm, edges]
    );

    // Dragging the marker itself moves the focal point (and only that).
    const startFocal = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dragRef.current = { mode: "focal" };
        surfaceRef.current?.setPointerCapture(e.pointerId);
    }, []);

    const startResize = useCallback(
        (handle: Handle) => (e: React.PointerEvent<HTMLDivElement>) => {
            e.stopPropagation();
            dragRef.current = { mode: `resize:${handle}` };
            surfaceRef.current?.setPointerCapture(e.pointerId);
        },
        []
    );

    const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        dragRef.current = null;
        surfaceRef.current?.releasePointerCapture(e.pointerId);
    }, []);

    const onSelectAspect = useCallback(
        (value: string) => {
            onChangeAspect(value);
            const r = DEFAULT_ASPECT_RATIOS.find(ar => ar.id === value)?.ratio;
            if (value === FREE || !r) {
                return;
            }
            // `r` is a display (pixel) aspect ratio; convert to a normalized ratio
            // so the crop, stored in normalized image coordinates, renders as `r`.
            const rNorm = r / imageRatio;
            // Re-fit the current crop to the chosen ratio, centered within it.
            const cw = edges.right - edges.left;
            const ch = edges.bottom - edges.top;
            let w = cw;
            let h = w / rNorm;
            if (h > ch) {
                h = ch;
                w = h * rNorm;
            }
            const cx = (edges.left + edges.right) / 2;
            const cy = (edges.top + edges.bottom) / 2;
            commitEdges({
                left: clamp01(cx - w / 2),
                right: clamp01(cx + w / 2),
                top: clamp01(cy - h / 2),
                bottom: clamp01(cy + h / 2)
            });
        },
        [edges, commitEdges, imageRatio, onChangeAspect]
    );

    const activeHotspot = clampHotspot(hotspot, edges);
    const handles = ratio === null ? [...CORNER_HANDLES, ...EDGE_HANDLES] : CORNER_HANDLES;

    const handlePosition = (handle: Handle): { left: string; top: string } => {
        const cx = (edges.left + edges.right) / 2;
        const cy = (edges.top + edges.bottom) / 2;
        const x = handle.includes("w") ? edges.left : handle.includes("e") ? edges.right : cx;
        const y = handle.includes("n") ? edges.top : handle.includes("s") ? edges.bottom : cy;
        return { left: `${x * 100}%`, top: `${y * 100}%` };
    };

    const cursorFor = (handle: Handle): string => {
        const map: Record<Handle, string> = {
            nw: "nwse-resize",
            se: "nwse-resize",
            ne: "nesw-resize",
            sw: "nesw-resize",
            n: "ns-resize",
            s: "ns-resize",
            e: "ew-resize",
            w: "ew-resize"
        };
        return map[handle];
    };

    return (
        <div className={"flex flex-col gap-sm"}>
            <div className={"flex items-end justify-between gap-md"}>
                <SectionLabel>Crop &amp; focal point</SectionLabel>
                <div className={"w-[200px] shrink-0"}>
                    <Select
                        label={"Crop shape"}
                        value={aspectId}
                        options={aspectOptions}
                        onChange={onSelectAspect}
                        displayResetAction={false}
                    />
                </div>
            </div>

            {/* Dark editing stage: the image sits centered on a near-black backdrop
                (like a pro image editor), so letterboxing around portrait images
                reads as intentional and the image stays the focal element. */}
            <div className={"flex justify-center rounded-md bg-neutral-dark p-lg"}>
                <div ref={wrapperRef} className={"w-full"}>
                    <div
                        ref={surfaceRef}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        className={
                            "relative mx-auto touch-none select-none overflow-hidden rounded-sm"
                        }
                        style={surfaceStyle}
                    >
                        <img
                            src={image.src}
                            alt={""}
                            draggable={false}
                            className={
                                "pointer-events-none absolute inset-0 h-full w-full object-cover"
                            }
                        />

                        {/* Crop rectangle: dims outside via box-shadow; interior drag moves the
                            crop. The border is two-tone (white edge + a 1px dark ring) so it stays
                            visible over both light and dark image areas. */}
                        <div
                            onPointerDown={startMoveCrop}
                            className={"absolute cursor-move border border-white/90"}
                            style={{
                                left: `${edges.left * 100}%`,
                                top: `${edges.top * 100}%`,
                                width: `${(edges.right - edges.left) * 100}%`,
                                height: `${(edges.bottom - edges.top) * 100}%`,
                                boxShadow:
                                    "0 0 0 1px rgba(0, 0, 0, 0.55), 0 0 0 9999px rgba(0, 0, 0, 0.45)"
                            }}
                        >
                            {/* Rule-of-thirds guides — a compositional aid and a cue for placing
                                the focal point. */}
                            <div className={"pointer-events-none absolute inset-0"}>
                                <div className={"absolute inset-y-0 left-1/3 w-px bg-white/30"} />
                                <div className={"absolute inset-y-0 left-2/3 w-px bg-white/30"} />
                                <div className={"absolute inset-x-0 top-1/3 h-px bg-white/30"} />
                                <div className={"absolute inset-x-0 top-2/3 h-px bg-white/30"} />
                            </div>

                            {/* Focal marker — the visible ring is small, but the draggable hit
                                area around it is larger for easier grabbing. */}
                            <div
                                onPointerDown={startFocal}
                                className={
                                    "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                                }
                                style={{
                                    left: `${((activeHotspot.x - edges.left) / Math.max(MIN, edges.right - edges.left)) * 100}%`,
                                    top: `${((activeHotspot.y - edges.top) / Math.max(MIN, edges.bottom - edges.top)) * 100}%`
                                }}
                            >
                                <div
                                    className={
                                        "pointer-events-none relative h-6 w-6 rounded-full border-2 border-white bg-white/25 shadow-lg"
                                    }
                                >
                                    <div
                                        className={
                                            "absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Resize handles — small visible dot inside a larger transparent hit
                            area so the corners/edges are easy to grab. */}
                        {handles.map(handle => {
                            const pos = handlePosition(handle);
                            return (
                                <div
                                    key={handle}
                                    onPointerDown={startResize(handle)}
                                    className={
                                        "absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center"
                                    }
                                    style={{
                                        left: pos.left,
                                        top: pos.top,
                                        cursor: cursorFor(handle)
                                    }}
                                >
                                    <div
                                        className={
                                            "pointer-events-none h-3 w-3 rounded-sm border border-neutral-dark bg-white shadow"
                                        }
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                Drag the handles to crop, drag inside to reposition, and drag the circle to set the
                focal point.
            </Text>
        </div>
    );
};
