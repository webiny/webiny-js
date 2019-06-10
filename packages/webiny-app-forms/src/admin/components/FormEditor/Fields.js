import React from "react";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { getPlugins } from "webiny-plugins";
import styled from "react-emotion";
import { Icon } from "webiny-ui/Icon";
import { Accordion, AccordionItem } from "webiny-ui/Accordion";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import Draggable from "./Draggable";

const FieldContainer = styled("div")({
    padding: "10px 15px",
    marginBottom: 10,
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
    }
});

const FieldLabel = styled("div")({
    textTransform: "uppercase",
    lineHeight: "145%"
});

const FieldHandle = styled("div")({
    marginRight: 15
});

const Field = ({ fieldType: { id, label } }) => {
    return (
        <Draggable beginDrag={{ ui: "field", type: id }}>
            {({ connectDragSource }) => (
                <FieldContainer>
                    <FieldHandle>
                        {connectDragSource(
                            <div>
                                <Icon icon={<HandleIcon />} />
                            </div>
                        )}
                    </FieldHandle>
                    <FieldLabel>{label}</FieldLabel>
                </FieldContainer>
            )}
        </Draggable>
    );
};

export const Fields = () => {
    const { fieldExists } = useFormEditor();

    function getGroups() {
        const fieldPlugins = getPlugins("form-editor-field-type")
            .filter(pl => !pl.fieldType.dataType)
            .filter(pl => !fieldExists(pl.fieldType.id));

        return getPlugins("form-editor-field-group").map(pl => ({
            ...pl.group,
            name: pl.name,
            fields: fieldPlugins.filter(f => f.fieldType.group === pl.name).map(pl => pl.fieldType)
        }));
    }

    return (
        <React.Fragment>
            <Field fieldType={{ id: "custom", label: "Custom field" }} />

            <Accordion>
                {getGroups().map(group => (
                    <AccordionItem key={group.name} title={group.title} icon={null}>
                        {!group.fields.length && (
                            <span>No fields are available at the moment!</span>
                        )}
                        {group.fields.map(fieldType => (
                            <Field key={fieldType.id} fieldType={fieldType} />
                        ))}
                    </AccordionItem>
                ))}
            </Accordion>
        </React.Fragment>
    );
};
