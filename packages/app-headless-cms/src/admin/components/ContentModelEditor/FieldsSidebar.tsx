import type { DragEventHandler } from "react";
import React from "react";
import { plugins } from "@webiny/plugins";
import Draggable from "../Draggable.js";
import type { CmsModelFieldTypePlugin, CmsModelLayoutFieldTypePlugin } from "~/types.js";
import { Icon, IconButton, Text } from "@webiny/admin-ui";
import { ReactComponent as CollapseSidebarIcon } from "@webiny/icons/view_sidebar.svg";

interface GridItemProps {
    testId: string;
    label: string;
    icon: React.ReactElement;
    onDragStart: DragEventHandler;
    dragRef: (element: HTMLElement | null) => void;
}

const GridItem = ({ testId, label, icon, onDragStart, dragRef }: GridItemProps) => {
    return (
        <div
            ref={dragRef}
            data-testid={testId}
            onDragStart={onDragStart}
            className={
                "flex flex-col items-center justify-center gap-[8px] size-20 bg-neutral-subtle rounded-md cursor-grab shrink-0"
            }
        >
            <Icon icon={icon} label={label} size={"lg"} color={"neutral-strong"} />
            <span
                className={
                    "text-xs font-normal text-neutral-strong text-center leading-4 overflow-hidden text-ellipsis whitespace-nowrap w-full px-[8px]"
                }
            >
                {label}
            </span>
        </div>
    );
};

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
            <div className={"flex items-center justify-between mb-md px-md py-md"}>
                <Text as="div" size={"sm"} className={"font-semibold text-neutral-primary"}>
                    Fields
                </Text>
                {onCollapse && (
                    <IconButton
                        variant={"ghost"}
                        size={"xs"}
                        icon={<CollapseSidebarIcon />}
                        onClick={onCollapse}
                    />
                )}
            </div>
            <div className={"flex flex-wrap gap-xs-plus py-sm px-md"}>
                {fieldTypePlugins.map(fieldPlugin => (
                    <Field
                        key={fieldPlugin.field.type}
                        fieldType={fieldPlugin.field}
                        onFieldDragStart={onFieldDragStart}
                    />
                ))}
            </div>
            {layoutFieldPlugins.length > 0 && (
                <>
                    <Text
                        as="div"
                        size={"sm"}
                        className={"font-semibold text-neutral-primary mt-md mb-md"}
                    >
                        Layout
                    </Text>
                    <div className={"flex flex-wrap gap-[6px]"}>
                        {layoutFieldPlugins.map(lp => (
                            <LayoutFieldItem
                                key={lp.field.type}
                                layoutField={lp.field}
                                onFieldDragStart={onFieldDragStart}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
};
