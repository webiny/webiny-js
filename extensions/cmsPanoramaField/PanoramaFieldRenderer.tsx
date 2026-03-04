import React, { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "webiny/admin/form";
import type { CmsBaseLayoutDescriptor } from "webiny/admin/cms/model";
import { Button, Grid, Text } from "webiny/admin/ui";
import {
    PanoramaViewer,
    type PanoramaHotspot,
    type PanoramaViewerConfig,
    type PanoramaViewerHandle,
    type ScenePosition
} from "./PanoramaViewer.js";

const hotspotsFieldPath = "panorama.hotspots";
const startPositionFieldPath = "panorama.startPosition";
const panLimitsFovFieldPath = "panorama.panLimitsFov";

interface PanoramaDescriptor extends CmsBaseLayoutDescriptor {
    type: "panorama";
    label: string;
    imageFieldPath: string;
    hotspotsFieldPath: string;
    startPositionFieldPath: string;
    panLimitsFovFieldPath: string;
}

interface PanoramaFieldRendererProps {
    descriptor: CmsBaseLayoutDescriptor;
}

export const PanoramaFieldRenderer = ({ descriptor }: PanoramaFieldRendererProps) => {
    const panorama = descriptor as PanoramaDescriptor;
    const [scenePosition, setScenePosition] = useState<ScenePosition>();
    const form = useForm();
    const viewerRef = useRef<PanoramaViewerHandle>(null);

    const rawValue = panorama.imageFieldPath ? form.getValue(panorama.imageFieldPath) : undefined;

    let imageUrl: string | undefined;
    if (typeof rawValue === "string") {
        imageUrl = rawValue;
    } else if (rawValue && typeof rawValue === "object" && "src" in rawValue) {
        imageUrl = (rawValue as { src: string }).src;
    }

    const hotspots: PanoramaHotspot[] = useMemo(() => {
        if (!hotspotsFieldPath) {
            return [];
        }
        const raw = form.getValue(hotspotsFieldPath);
        if (Array.isArray(raw)) {
            return raw;
        }
        return [];
    }, [form.getValue(hotspotsFieldPath)]);

    const config = {
        sp: form.getValue(startPositionFieldPath),
        pl: form.getValue(panLimitsFovFieldPath)
    };

    // Build viewer config from form fields
    const viewerConfig: PanoramaViewerConfig = useMemo(() => {
        const cfg: PanoramaViewerConfig = {};

        const sp = config.sp;
        if (sp && typeof sp === "object") {
            if (sp.horizontalYaw != null) cfg.yaw = Number(sp.horizontalYaw);
            if (sp.verticalPitch != null) cfg.pitch = Number(sp.verticalPitch);
            if (sp.zoom != null) cfg.hfov = Number(sp.zoom);
        }

        const pl = config.pl;
        if (pl && typeof pl === "object") {
            if (pl.leftLimit != null) cfg.minYaw = Number(pl.leftLimit);
            if (pl.rightLimit != null) cfg.maxYaw = Number(pl.rightLimit);
            if (pl.downLimit != null) cfg.minPitch = Number(pl.downLimit);
            if (pl.upLimit != null) cfg.maxPitch = Number(pl.upLimit);
            if (pl.maxZoomIn != null) cfg.minHfov = Number(pl.maxZoomIn);
            if (pl.maxZoomOut != null) cfg.maxHfov = Number(pl.maxZoomOut);
        }

        return cfg;
    }, [JSON.stringify(config)]);

    const onHotspotMove = useCallback(
        (index: number, pitch: number, yaw: number) => {
            if (!hotspotsFieldPath) {
                return;
            }
            const updated = hotspots.map((hs, i) => (i === index ? { ...hs, pitch, yaw } : hs));
            form.setValue(hotspotsFieldPath, updated);
        },
        [hotspots, form.setValue]
    );

    const handleSetStartPosition = useCallback(() => {
        if (!startPositionFieldPath || !viewerRef.current) {
            return;
        }
        const state = viewerRef.current.getViewerState();
        const current = form.getValue(startPositionFieldPath) || {};
        form.setValue(startPositionFieldPath, {
            ...current,
            horizontalYaw: state.yaw,
            verticalPitch: state.pitch,
            zoom: state.hfov
        });
    }, [form.getValue, form.setValue]);

    if (!imageUrl) {
        return (
            <div className={"flex w-full"}>
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {panorama.label}: No image set
                </Text>
            </div>
        );
    }

    return (
        <Grid.Column span={12}>
            <div className={"flex w-full flex-col"}>
                <div className={"flex items-center justify-between mb-sm"}>
                    {panorama.label && (
                        <Text as={"div"} size={"sm"} className={"font-semibold"}>
                            {panorama.label}
                        </Text>
                    )}
                </div>
                {scenePosition ? (
                    <>
                        Pitch: {scenePosition.pitch.toFixed(1)}&deg; / Yaw:
                        {scenePosition.yaw.toFixed(1)}&deg; / FOV: {scenePosition.hfov.toFixed(1)}
                        &deg;
                    </>
                ) : null}
                <PanoramaViewer
                    ref={viewerRef}
                    imageUrl={imageUrl}
                    hotspots={hotspots}
                    config={viewerConfig}
                    onSceneMove={setScenePosition}
                    onHotspotMove={onHotspotMove}
                />
                <div className={"mt-sm"}>
                    <Button
                        size={"sm"}
                        variant={"secondary"}
                        onClick={handleSetStartPosition}
                        text={"Set Start Position"}
                    />
                </div>
            </div>
        </Grid.Column>
    );
};
