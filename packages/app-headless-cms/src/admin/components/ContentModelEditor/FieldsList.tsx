import React, { DragEventHandler } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { Icon } from "@webiny/ui/Icon";
import Draggable from "../Draggable";
import { CmsEditorFieldTypePlugin } from "~/types";
import { Typography } from "@webiny/ui/Typography";

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
    color: "var(--mdc-theme-on-surface)"
});

const FieldDescription = styled("div")({
    fontSize: 14,
    color: "var(--mdc-theme-text-secondary-on-background)"
});

const FieldHandle = styled("div")({
    marginRight: 15,
    color: "var(--mdc-theme-on-surface)"
});

const LeftBarTitle = styled("div")({
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    display: "flex",
    alignItems: "center",
    padding: 25,
    color: "var(--mdc-theme-on-surface)"
});

const titleIcon = css({
    height: 24,
    marginRight: 15,
    color: "var(--mdc-theme-primary)"
});

const LeftBarFieldList = styled("div")({
    padding: 40,
    overflow: "auto"
    // height: "calc(100vh - 250px)"
});

export interface FieldProps {
    onFieldDragStart: DragEventHandler;
    fieldType: CmsEditorFieldTypePlugin["field"];
}

export const Field: React.FC<FieldProps> = props => {
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

export interface FieldsListProps {
    icon: JSX.Element;
    title: string;
    onFieldDragStart: DragEventHandler;
    fieldTypePlugins: CmsEditorFieldTypePlugin[];
}

export const FieldsList: React.FC<FieldsListProps> = ({
    icon,
    title,
    onFieldDragStart,
    fieldTypePlugins
}) => {
    return (
        <React.Fragment>
            <LeftBarTitle>
                <Icon className={titleIcon} icon={icon} />
                <Typography use={"headline6"}>{title}</Typography>
            </LeftBarTitle>
            <LeftBarFieldList>
                {fieldTypePlugins.map(fieldPlugin => (
                    <Field
                        key={fieldPlugin.field.type}
                        fieldType={fieldPlugin.field}
                        onFieldDragStart={onFieldDragStart}
                    />
                ))}
            </LeftBarFieldList>
        </React.Fragment>
    );
};
