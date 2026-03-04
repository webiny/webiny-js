import type { DragEventHandler } from "react";
import React from "react";
import { plugins } from "@webiny/plugins";
import Draggable from "../Draggable.js";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { Heading, Icon, Text } from "@webiny/admin-ui";

interface FieldProps {
    onFieldDragStart: DragEventHandler;
    fieldType: CmsModelFieldTypePlugin["field"];
}

const Field = (props: FieldProps) => {
    const {
        onFieldDragStart,
        fieldType: { type, label, icon, description }
    } = props;
    return (
        <Draggable beginDrag={{ type: "newField", fieldType: type }}>
            {({ drag }) => (
                <div
                    ref={el => {
                        drag(el);
                    }}
                    data-testid={`cms-editor-fields-field-${type}`}
                    onDragStart={onFieldDragStart}
                    className={
                        "bg-neutral-base rounded-sm mb-sm py-sm px-md cursor-grab last-of-type:mb-none hover:opacity-80 transition-opacity"
                    }
                >
                    <div className={"flex items-center gap-md"}>
                        <div>
                            <Icon
                                icon={icon as React.ReactElement}
                                label={label}
                                size={"md"}
                                color={"neutral-light"}
                            />
                        </div>
                        <div>
                            <Heading level={6}>{label}</Heading>
                            <Text size={"sm"} className={"text-neutral-strong"}>
                                {description}
                            </Text>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

interface FieldsSidebarProps {
    onFieldDragStart: DragEventHandler;
}

export const FieldsSidebar = ({ onFieldDragStart }: FieldsSidebarProps) => {
    const fieldTypePlugin = plugins
        .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
        .filter(p => !p.field.hideInAdmin);

    return (
        <>
            {fieldTypePlugin.map(fieldPlugin => (
                <Field
                    key={fieldPlugin.field.type}
                    fieldType={fieldPlugin.field}
                    onFieldDragStart={onFieldDragStart}
                />
            ))}
        </>
    );
};
