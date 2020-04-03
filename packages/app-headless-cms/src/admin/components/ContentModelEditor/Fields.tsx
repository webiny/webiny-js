import React from "react";
import { getPlugins } from "@webiny/plugins";
import styled from "@emotion/styled";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import Draggable from "./Draggable";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

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

const FieldLabel = styled("div")({
    textTransform: "uppercase",
    lineHeight: "145%",
    color: "var(--mdc-theme-on-surface)"
});

const FieldHandle = styled("div")({
    marginRight: 15,
    color: "var(--mdc-theme-on-surface)"
});

const Field = ({ onFieldDragStart, fieldType: { name, label } }) => {
    return (
        <Draggable beginDrag={{ ui: "field", name }}>
            {({ drag }) => (
                <div ref={drag} style={{ marginBottom: 10 }} onDragStart={onFieldDragStart}>
                    <FieldContainer>
                        <FieldHandle>
                            <Icon icon={<HandleIcon />} />
                        </FieldHandle>
                        <FieldLabel>{label}</FieldLabel>
                    </FieldContainer>
                </div>
            )}
        </Draggable>
    );
};

export const Fields = ({ onFieldDragStart }) => {
    const presetFieldPlugins = getPlugins<FbBuilderFieldPlugin>("content-model-editor-field-type");

    return (
        <React.Fragment>
            {presetFieldPlugins.map(fieldPlugin => (
                <Field
                    key={fieldPlugin.name}
                    fieldType={fieldPlugin.field}
                    onFieldDragStart={onFieldDragStart}
                />
            ))}
        </React.Fragment>
    );
};
