import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

export interface PanoramaHotspot {
    pitch?: number;
    yaw?: number;
    text?: string;
    type?: string;
    url?: string;
    attributes?: Record<string, string>;
    image?: string;
    video?: string;
    width?: number;
    cssClass?: string;
    sceneId?: string;
    targetPitch?: number;
    targetYaw?: number;
    targetHfov?: number;
    [key: string]: unknown;
}

export interface PanoramaViewerConfig {
    pitch?: number;
    yaw?: number;
    hfov?: number;
    minPitch?: number;
    maxPitch?: number;
    minYaw?: number;
    maxYaw?: number;
    minHfov?: number;
    maxHfov?: number;
}

export interface PanoramaViewerHandle {
    getViewerState(): PanoramaViewerConfig;
}

export interface ScenePosition {
    pitch: number;
    yaw: number;
    hfov: number;
}

interface PanoramaViewerProps {
    imageUrl: string;
    hotspots: PanoramaHotspot[];
    config?: PanoramaViewerConfig;
    onSceneMove?: (data: ScenePosition) => void;
    onHotspotMove?: (index: number, pitch: number, yaw: number) => void;
}

/**
 * Generate a stable viewer ID for a hotspot based on its array index and content hash.
 */
function hotspotViewerId(index: number, hs: PanoramaHotspot): string {
    const parts = [
        index,
        hs.text ?? "",
        hs.type ?? "",
        hs.url ?? "",
        hs.image ?? "",
        hs.video ?? "",
        hs.cssClass ?? "",
        hs.sceneId ?? ""
    ];
    let hash = 0;
    const str = parts.join("|");
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return `hs_${index}_${(hash >>> 0).toString(36)}`;
}

/**
 * Compare two hotspots by their data attributes (everything except pitch/yaw,
 * which are handled by dragging).
 */
function hotspotChanged(a: PanoramaHotspot, b: PanoramaHotspot): boolean {
    return (
        a.text !== b.text ||
        a.type !== b.type ||
        a.url !== b.url ||
        a.image !== b.image ||
        a.video !== b.video ||
        a.width !== b.width ||
        a.cssClass !== b.cssClass ||
        a.sceneId !== b.sceneId ||
        a.targetPitch !== b.targetPitch ||
        a.targetYaw !== b.targetYaw ||
        a.targetHfov !== b.targetHfov
    );
}

interface TrackedHotspot {
    viewerId: string;
    index: number;
    hotspot: PanoramaHotspot;
}

export const PanoramaViewer = forwardRef<PanoramaViewerHandle, PanoramaViewerProps>(
    ({ imageUrl, hotspots, config, onHotspotMove, onSceneMove }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const viewerRef = useRef<any>(null);
        const onHotspotMoveRef = useRef(onHotspotMove);
        const prevTrackedRef = useRef<TrackedHotspot[]>([]);

        onHotspotMoveRef.current = onHotspotMove;

        // Expose viewer state to parent via ref
        useImperativeHandle(
            ref,
            () => ({
                getViewerState(): PanoramaViewerConfig {
                    const viewer = viewerRef.current;
                    if (!viewer) {
                        return {};
                    }
                    const [minPitch, maxPitch] = viewer.getPitchBounds();
                    const [minYaw, maxYaw] = viewer.getYawBounds();
                    const [minHfov, maxHfov] = viewer.getHfovBounds();
                    return {
                        pitch: viewer.getPitch().toFixed(2),
                        yaw: viewer.getYaw().toFixed(2),
                        hfov: viewer.getHfov(),
                        minPitch,
                        maxPitch,
                        minYaw,
                        maxYaw,
                        minHfov,
                        maxHfov
                    };
                }
            }),
            []
        );

        const makeDragHandler = useCallback((index: number) => {
            return (e: MouseEvent) => {
                if (!viewerRef.current) return;
                const [pitch, yaw] = viewerRef.current.mouseEventToCoords(e);
                onHotspotMoveRef.current?.(index, pitch, yaw);
            };
        }, []);

        // Create/destroy viewer only when imageUrl changes
        useEffect(() => {
            if (!containerRef.current || !imageUrl) {
                return;
            }

            viewerRef.current = pannellum.viewer(containerRef.current, {
                type: "equirectangular",
                panorama: imageUrl,
                autoLoad: true,
                mouseZoom: true,
                showControls: false,
                pitch: config?.pitch ?? 0,
                yaw: config?.yaw ?? 0,
                hfov: config?.hfov ?? 100,
                minPitch: config?.minPitch ?? -90,
                maxPitch: config?.maxPitch ?? 90,
                minYaw: config?.minYaw ?? -180,
                maxYaw: config?.maxYaw ?? 180,
                minHfov: config?.minHfov ?? 30,
                maxHfov: config?.maxHfov ?? 120,
                hotSpots: []
            });

            viewerRef.current.on("animatefinished", onSceneMove);

            prevTrackedRef.current = [];

            return () => {
                if (viewerRef.current) {
                    viewerRef.current.off("animatefinished", onSceneMove);
                    viewerRef.current.destroy();
                    viewerRef.current = null;
                }
                prevTrackedRef.current = [];
            };
            // config is intentionally read only on mount/imageUrl change
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [imageUrl]);

        // Sync config changes to the live viewer (without recreating it)
        useEffect(() => {
            const viewer = viewerRef.current;
            if (!viewer || !config) {
                return;
            }

            if (config.pitch != null) {
                viewer.setPitch(config.pitch, false);
            }
            if (config.yaw != null) {
                viewer.setYaw(config.yaw, false);
            }
            if (config.hfov != null) {
                viewer.setHfov(config.hfov, false);
            }
            if (config.minPitch != null || config.maxPitch != null) {
                viewer.setPitchBounds([config.minPitch ?? -90, config.maxPitch ?? 90]);
            }
            if (config.minYaw != null || config.maxYaw != null) {
                viewer.setYawBounds([config.minYaw ?? -180, config.maxYaw ?? 180]);
            }
            if (config.minHfov != null || config.maxHfov != null) {
                viewer.setHfovBounds([config.minHfov ?? 30, config.maxHfov ?? 120]);
            }
        }, [config]);

        // Sync hotspots incrementally
        useEffect(() => {
            const viewer = viewerRef.current;
            if (!viewer) {
                return;
            }

            const prev = prevTrackedRef.current;
            const prevByViewerId = new Map(prev.map(t => [t.viewerId, t]));

            const nextTracked: TrackedHotspot[] = hotspots.map((hs, index) => ({
                viewerId: hotspotViewerId(index, hs),
                index,
                hotspot: hs
            }));
            const nextByViewerId = new Map(nextTracked.map(t => [t.viewerId, t]));

            for (const old of prev) {
                const next = nextByViewerId.get(old.viewerId);
                if (!next || hotspotChanged(old.hotspot, next.hotspot)) {
                    viewer.removeHotSpot(old.viewerId);
                }
            }

            for (const tracked of nextTracked) {
                const old = prevByViewerId.get(tracked.viewerId);
                if (!old || hotspotChanged(old.hotspot, tracked.hotspot)) {
                    const hs = tracked.hotspot;
                    const hasPitch = hs.pitch != null && hs.pitch !== 0;
                    const hasYaw = hs.yaw != null && hs.yaw !== 0;
                    const pitch = hasPitch ? hs.pitch! : viewer.getPitch();
                    const yaw = hasYaw ? hs.yaw! : viewer.getYaw();

                    viewer.addHotSpot({
                        id: tracked.viewerId,
                        pitch,
                        yaw,
                        text: hs.text,
                        type: hs.type || "info",
                        URL: hs.url,
                        attributes: hs.attributes,
                        image: hs.image,
                        video: hs.video,
                        width: hs.width,
                        cssClass: hs.cssClass,
                        sceneId: hs.sceneId,
                        targetPitch: hs.targetPitch,
                        targetYaw: hs.targetYaw,
                        targetHfov: hs.targetHfov,
                        draggable: true,
                        dragHandlerFunc: makeDragHandler(tracked.index)
                    });

                    if (!hasPitch || !hasYaw) {
                        onHotspotMoveRef.current?.(tracked.index, pitch, yaw);
                    }
                }
            }

            prevTrackedRef.current = nextTracked;
        }, [hotspots, makeDragHandler]);

        return <div ref={containerRef} style={{ width: "100%", height: "400px" }} />;
    }
);
