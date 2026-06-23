import type { DragEventHandler } from "react";
import React, { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { plugins } from "@webiny/plugins";
import Draggable from "../Draggable.js";
import type { CmsModelLayoutFieldTypePlugin } from "~/types.js";
import { IconButton } from "@webiny/admin-ui";
import { GridItem } from "./GridItem.js";
import { SectionHeader } from "./SectionHeader.js";
import { FieldsGrid } from "./FieldsGrid.js";
import { ReactComponent as CollapseSidebarIcon } from "@webiny/icons/right_panel_open.svg";
import { CmsFieldType, type ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";

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
    const container = useContainer();

    const fieldTypes = useMemo(() => {
        return container.resolveAll(CmsFieldType).filter(ft => !ft.hideInAdmin);
    }, [container]);

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
                {fieldTypes.map(ft => (
                    <Field
                        key={ft.type}
                        fieldType={ft}
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
