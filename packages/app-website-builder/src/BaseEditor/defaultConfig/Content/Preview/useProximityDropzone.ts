import { useEffect, useState } from "react";
import { useDropZoneManager } from "./DropZoneManagerProvider.js";
import type { Box } from "./Box.js";
import type { ElementFactoryCreateElementParams } from "@webiny/website-builder-sdk";
import type { DropZoneProximity } from "~/BaseEditor/defaultConfig/Content/Preview/DropZoneManager.js";

export interface DropEvent {
    item: {
        id?: string;
        componentName: string;
        // The new element's bindings, in place of the manifest's defaults.
        bindings?: ElementFactoryCreateElementParams["bindings"];
    };
    target: { parentId: string; slot: string; index: number };
}

interface UseProximityDropzoneParams {
    id: string;
    box: Box;
    canAccept?: () => boolean;
}

export function useProximityDropzone({ id, box, canAccept }: UseProximityDropzoneParams) {
    const dropzoneManager = useDropZoneManager();
    const [proximity, setProximity] = useState<DropZoneProximity | null>(null);

    useEffect(() => {
        dropzoneManager.register({
            id,
            box,
            canAccept,
            onProximityChange: proximity => {
                setProximity(proximity);
            }
        });

        return () => {
            dropzoneManager.unregister(id);
        };
    }, [id, box, canAccept]);

    return { proximity };
}
