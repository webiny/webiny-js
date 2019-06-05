import React from "react";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";
import { getPlugins } from "webiny-plugins";
import styled from "react-emotion";
import { Icon } from "webiny-ui/Icon";
import { Elevation } from "webiny-ui/Elevation";
import { Accordion, AccordionItem } from "webiny-ui/Accordion";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import Draggable from "./Draggable";

const FieldContainer = styled("div")({
    height: 25,
    padding: 5,
    marginBottom: 10
});

const FieldLabel = styled("div")({
    float: "left",
    textTransform: "uppercase"
});

const FieldHandle = styled("div")({
    float: "right",
    cursor: "grab"
});

function useFields() {
    const { state, fieldExists } = useFormEditor();

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

    return { getGroups, state };
}

const Field = ({ fieldType: { id, label } }) => {
    return (
        <Draggable beginDrag={{ ui: "field", type: id }}>
            {({ connectDragSource }) => (
                <Elevation z={5}>
                    <FieldContainer>
                        <FieldLabel>{label}</FieldLabel>
                        <FieldHandle>
                            {connectDragSource(
                                <div>
                                    <Icon icon={<HandleIcon />} />
                                </div>
                            )}
                        </FieldHandle>
                    </FieldContainer>
                </Elevation>
            )}
        </Draggable>
    );
};

export const Fields = () => {
    const { getGroups } = useFields();
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
