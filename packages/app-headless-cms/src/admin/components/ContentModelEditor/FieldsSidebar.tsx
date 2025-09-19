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
                    // @ts-expect-error
                    ref={drag}
                    data-testid={`cms-editor-fields-field-${type}`}
                    onDragStart={onFieldDragStart}
                    className={
                        "wby-bg-neutral-base wby-rounded-sm wby-mb-sm wby-py-sm wby-px-md wby-cursor-grab last-of-type:wby-mb-none hover:wby-opacity-80 wby-transition-opacity"
                    }
                >
                    <div className={"wby-flex wby-items-center wby-gap-md"}>
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
                            <Text size={"sm"} className={"wby-text-neutral-strong"}>
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
