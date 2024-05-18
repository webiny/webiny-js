import React, { DragEventHandler } from "react";
import { plugins } from "@webiny/plugins";
import styled from "@emotion/styled";
import { Icon } from "@webiny/ui/Icon";
import Draggable from "../Draggable";
import { CmsModelFieldTypePlugin } from "~/types";

const FieldContainer = styled("div")({
    padding: "10px 15px",
    marginBottom: 20,
    display: "flex",
    width: "100%",
    backgroundColor: "var(--mdc-theme-on-background)",
    borderRadius: 15,
    boxSizing: "border-box",
    cursor: "grab",
    opacity: 1,
    transition: "opacity 225ms",
    "&:hover": {
        opacity: 0.8
    },
    "&:last-child": {
        marginBottom: 0
    }
});

const FileInfo = styled("div")({});

const FieldLabel = styled("div")({
    textTransform: "uppercase",
    lineHeight: "145%",
    fontFamily: "var(--mdc-typography-font-family)",
    color: "var(--mdc-theme-on-surface)"
});

const FieldDescription = styled("div")({
    fontSize: 14,
    fontFamily: "var(--mdc-typography-font-family)",
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const FieldHandle = styled("div")({
    marginRight: 15,
    color: "var(--mdc-theme-on-surface)"
});

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
                    ref={drag}
                    style={{ marginBottom: 10 }}
                    data-testid={`cms-editor-fields-field-${type}`}
                    onDragStart={onFieldDragStart}
                >
                    <FieldContainer>
                        <FieldHandle>
                            <Icon icon={icon as React.ReactElement} />
                        </FieldHandle>
                        <FileInfo>
                            <FieldLabel>{label}</FieldLabel>
                            <FieldDescription>{description}</FieldDescription>
                        </FileInfo>
                    </FieldContainer>
                </div>
            )}
        </Draggable>
    );
};

interface FieldsSidebarProps {
    onFieldDragStart: DragEventHandler;
}

export const FieldsSidebar = ({ onFieldDragStart }: FieldsSidebarProps) => {
    const fieldTypePlugin = plugins.byType<CmsModelFieldTypePlugin>("cms-editor-field-type");

    return (
        <React.Fragment>
            {fieldTypePlugin.map(fieldPlugin => (
                <Field
                    key={fieldPlugin.field.type}
                    fieldType={fieldPlugin.field}
                    onFieldDragStart={onFieldDragStart}
                />
            ))}
        </React.Fragment>
    );
};
