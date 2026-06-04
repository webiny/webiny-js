import React, { useEffect, useRef, useState } from "react";
import type { DragLayerMonitor } from "react-dnd";
import { useDragLayer } from "react-dnd";
import { plugins } from "@webiny/plugins";
import { DragCursor } from "@webiny/admin-ui";
import { subscribeToDropZoneOver } from "./dropZoneOverState.js";
import type {
    CmsModelFieldTypePlugin,
    CmsModelLayoutFieldTypePlugin,
    DragSource
} from "~/types.js";

const getDragInfo = (item: DragSource | null): { label: string; icon?: React.ReactElement } => {
    if (!item) {
        return { label: "" };
    }

    if (item.type === "newField" && item.fieldType) {
        const plugin = plugins
            .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
            .find(p => p.field.type === item.fieldType);
        return {
            label: plugin?.field.label ?? item.fieldType,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "field" && item.field) {
        const plugin = plugins
            .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
            .find(p => p.field.type === item.field!.type);
        return {
            label: item.field.label,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "newLayoutField" && item.layoutFieldType) {
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutFieldType);
        return {
            label: plugin?.field.label ?? item.layoutFieldType,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "layoutField" && item.layoutField) {
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutField!.type);
        return {
            label: plugin?.field.label ?? "Layout",
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "row") {
        const first = item.fields?.[0];
        return { label: first ? first.label : "Row" };
    }

    return { label: "Field" };
};

let dragPreviewRef: HTMLDivElement | null = null;

const DragPreview = () => {
    const [opacity, setOpacity] = useState(0);
    const [isOverSlot, setIsOverSlot] = useState(false);
    const monitorRef = useRef<DragLayerMonitor | null>(null);

    const { isDragging, item } = useDragLayer((monitor: DragLayerMonitor) => {
        monitorRef.current = monitor;

        const offset = monitor.getClientOffset();
        if (offset && dragPreviewRef) {
            dragPreviewRef.style.transform = `translate(${offset.x + 12}px, ${offset.y + 12}px)`;
        }

        return {
            isDragging: monitor.isDragging(),
            item: monitor.getItem() as DragSource | null
        };
    });

    useEffect(() => {
        if (isDragging) {
            const t = setTimeout(() => setOpacity(1), 80);
            return () => clearTimeout(t);
        }
        setOpacity(0);
        return undefined;
    }, [isDragging]);

    useEffect(() => {
        return subscribeToDropZoneOver(setIsOverSlot);
    }, []);

    useEffect(() => {
        return () => {
            dragPreviewRef = null;
        };
    }, []);

    if (!isDragging) {
        return null;
    }

    const { label, icon } = getDragInfo(item);

    return (
        <div className={"fixed pointer-events-none left-0 top-0 w-full h-full z-[1001]"}>
            <div
                ref={el => {
                    dragPreviewRef = el;
                }}
                className={"absolute transition-opacity duration-100"}
                style={{ opacity }}
            >
                <DragCursor label={label} icon={icon} isOverSlot={isOverSlot} />
            </div>
        </div>
    );
};

export default DragPreview;
