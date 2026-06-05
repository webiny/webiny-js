import type { DragEventHandler } from "react";
import React from "react";
import { plugins } from "@webiny/plugins";
import Draggable from "../Draggable.js";
import type { CmsModelFieldTypePlugin, CmsModelLayoutFieldTypePlugin } from "~/types.js";
import { IconButton } from "@webiny/admin-ui";
import { GridItem } from "./GridItem.js";
import { SectionHeader } from "./SectionHeader.js";
import { FieldsGrid } from "./FieldsGrid.js";
import { ReactComponent as CollapseSidebarIcon } from "@webiny/icons/right_panel_open.svg";

interface FieldProps {
    onFieldDragStart: DragEventHandler;
    fieldType: CmsModelFieldTypePlugin["field"];
}

const Field = ({ onFieldDragStart, fieldType: { type, label, icon } }: FieldProps) => {
    return (
        <Draggable beginDrag={{ type: "newField", fieldType: type }}>
            {({ drag }) => (
                <GridItem
                    testId={`cms-editor-fields-field-${type}`}
                    label={label}
                    icon={icon as React.ReactElement}
                    onDragStart={onFieldDragStart}
                    dragRef={element => drag(element)}
                />
            )}
        </Draggable>
    );
};

interface LayoutFieldItemProps {
    onFieldDragStart: DragEventHandler;
    layoutField: CmsModelLayoutFieldTypePlugin["field"];
}

const LayoutFieldItem = ({
    onFieldDragStart,
    layoutField: { type, label, icon }
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
    const fieldTypePlugins = plugins
        .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
        .filter(p => !p.field.hideInAdmin);

    const layoutFieldPlugins = plugins.byType<CmsModelLayoutFieldTypePlugin>(
        "cms-editor-layout-field-type"
    );

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
                {fieldTypePlugins.map(fieldPlugin => (
                    <Field
                        key={fieldPlugin.field.type}
                        fieldType={fieldPlugin.field}
                        onFieldDragStart={onFieldDragStart}
                    />
                ))}
            </FieldsGrid>
            {layoutFieldPlugins.length > 0 && (
                <>
                    <SectionHeader title={"Layout"} />
                    <FieldsGrid>
                        {layoutFieldPlugins.map(lp => (
                            <LayoutFieldItem
                                key={lp.field.type}
                                layoutField={lp.field}
                                onFieldDragStart={onFieldDragStart}
                            />
                        ))}
                    </FieldsGrid>
                </>
            )}
        </>
    );
};
