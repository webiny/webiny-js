import type { DragEventHandler } from "react";
import React, { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { useModelEditor } from "~/admin/hooks/index.js";
import Draggable from "../Draggable.js";
import { IconButton } from "@webiny/admin-ui";
import { GridItem } from "./GridItem.js";
import { SectionHeader } from "./SectionHeader.js";
import { FieldsGrid } from "./FieldsGrid.js";
import { ReactComponent as CollapseSidebarIcon } from "@webiny/icons/right_panel_open.svg";
import { CmsFieldType, type ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";
import {
    CmsLayoutFieldType,
    type ICmsLayoutFieldType
} from "~/presentation/fieldTypes/abstractions.js";

interface FieldProps {
    onFieldDragStart: DragEventHandler;
    fieldType: ICmsFieldType;
}

const Field = ({ onFieldDragStart, fieldType }: FieldProps) => {
    return (
        <Draggable beginDrag={{ type: "newField", fieldType: fieldType.type }}>
            {({ drag }) => (
                <GridItem
                    testId={`cms-editor-fields-field-${fieldType.type}`}
                    label={fieldType.label}
                    icon={fieldType.icon}
                    onDragStart={onFieldDragStart}
                    dragRef={element => drag(element)}
                />
            )}
        </Draggable>
    );
};

interface LayoutFieldItemProps {
    onFieldDragStart: DragEventHandler;
    layoutFieldType: ICmsLayoutFieldType;
}

const LayoutFieldItem = ({
    onFieldDragStart,
    layoutFieldType: { type, label, icon }
}: LayoutFieldItemProps) => {
    return (
        <Draggable beginDrag={{ type: "newLayoutField", layoutFieldType: type }}>
            {({ drag }) => (
                <GridItem
                    testId={`cms-editor-fields-layout-field-${type}`}
                    label={label}
                    icon={icon as React.ReactElement}
                    onDragStart={onFieldDragStart}
                    dragRef={element => drag(element)}
                />
            )}
        </Draggable>
    );
};

interface FieldsSidebarProps {
    onFieldDragStart: DragEventHandler;
    onCollapse?: () => void;
}

export const FieldsSidebar = ({ onFieldDragStart, onCollapse }: FieldsSidebarProps) => {
    const container = useContainer();
    const { data: model } = useModelEditor();

    const fieldTypes = useMemo(() => {
        const existingTypes = new Set((model?.fields ?? []).map(f => f.type));
        return container.resolveAll(CmsFieldType).filter(ft => {
            if (ft.hideInAdmin) {
                return false;
            }
            // Deprecated field types (e.g. "file", superseded by "asset") are only
            // offered when the model already contains a field of that type, so
            // existing models stay editable while new fields use the replacement.
            if (ft.deprecated) {
                return existingTypes.has(ft.type);
            }
            return true;
        });
    }, [container, model?.fields]);

    const layoutFieldTypes = useMemo(() => {
        return container.resolveAll(CmsLayoutFieldType);
    }, [container]);

    return (
        <>
            <SectionHeader
                title={"Fields"}
                action={
                    onCollapse && (
                        <IconButton
                            variant={"ghost"}
                            size={"xs"}
                            icon={<CollapseSidebarIcon />}
                            onClick={onCollapse}
                        />
                    )
                }
            />
            <FieldsGrid>
                {fieldTypes.map(ft => (
                    <Field key={ft.type} fieldType={ft} onFieldDragStart={onFieldDragStart} />
                ))}
            </FieldsGrid>
            {layoutFieldTypes.length > 0 && (
                <>
                    <SectionHeader title={"Layout"} />
                    <FieldsGrid>
                        {layoutFieldTypes.map(lft => (
                            <LayoutFieldItem
                                key={lft.type}
                                layoutFieldType={lft}
                                onFieldDragStart={onFieldDragStart}
                            />
                        ))}
                    </FieldsGrid>
                </>
            )}
        </>
    );
};
