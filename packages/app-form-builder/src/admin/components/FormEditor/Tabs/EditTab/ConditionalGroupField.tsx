import React, { useCallback, useState } from "react";
import styled from "@emotion/styled";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as EditIcon } from "../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { useFormEditor } from "../../Context";
import { FbFormModelField } from "~/types";
import { Accordion } from "@webiny/ui/Accordion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Center, Vertical, Horizontal } from "../../DropZone";
import Field from "./Field";
import { EditContainer, RowContainer } from "./Styled";
import Draggable from "../../Draggable";

const FieldContainer = styled("div")({
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
});

const Info = styled("div")({
    display: "flex",
    flexDirection: "column",
    "> *": {
        flex: "1 100%",
        lineHeight: "150%"
    }
});

const Actions = styled("div")({
    display: "flex",
    flexDirection: "row",
    alignItems: "right",
    "> *": {
        flex: "1 100%"
    },
    ".switch-wrapper": {
        display: "flex",
        alignItems: "center",
        color: "var(--mdc-theme-text-secondary-on-background)",
        ".webiny-ui-switch": {
            margin: "0 16px"
        }
    }
});

const StyledDivider = styled("div")({
    width: 2,
    margin: 5,
    backgroundColor: "var(--mdc-theme-on-background)"
});

interface FieldProps {
    field: FbFormModelField;
    onEdit: (field: FbFormModelField) => void;
    onDelete: (field: FbFormModelField) => void;
    onDrop: any;
}
// Add a prop or a state for the beggining to track whether it's gonna save element here.
// Also need to define it is as the target so it won't drop field outside of this field.
const ConditionalGroupField: React.FC<FieldProps> = props => {
    const { field, onEdit, onDelete, onDrop } = props;
    const { getFieldPlugin, updateField } = useFormEditor();
    const fieldPlugin = getFieldPlugin({ name: field.name });
    const [fields, setFields] = useState<any[]>([]);

    const onDropField = (source: any, position: any) => {
        const plugin = getFieldPlugin({ name: source.name });
        // @ts-ignore
        setFields(prevState => [...prevState, plugin.field.createField()]);
    };

    React.useEffect(() => {
        console.log("fields", fields);
    }, [fields]);

    return (
        <Accordion>
            <AccordionItem
                title="Condition Group"
                open={true}
                actions={
                    <AccordionItem.Actions>
                        <AccordionItem.Action icon={<EditIcon />} onClick={() => onEdit(field)} />
                        <AccordionItem.Action
                            icon={<DeleteIcon />}
                            onClick={() => onDelete(field)}
                        />
                    </AccordionItem.Actions>
                }
            >
                {fields.length === 0 ? (
                    <Center
                        onDrop={item => {
                            console.log(item);
                            // It will be a special onDrop for this field
                            // that would save fields in array for this field
                            onDropField(item, {
                                row: 0,
                                index: 0
                            });
                            return undefined;
                        }}
                    >
                        {`Drop your first field here`}
                    </Center>
                ) : (
                    fields.map((field, index) => {
                        <Draggable
                            beginDrag={{ ui: "row", pos: { row: index } }}
                            key={`row-${index}`}
                        >
                            {({ drag, isDragging }) => (
                                <RowContainer
                                    style={{
                                        opacity: isDragging ? 0.3 : 1,
                                        border: "none",
                                        background: "transparent",
                                        boxShadow: "none",
                                        marginBottom: 0
                                    }}
                                >
                                    <Field
                                        field={field}
                                        onEdit={() => console.log("edit")}
                                        onDelete={() => console.log("delete")}
                                    />
                                </RowContainer>
                            )}
                        </Draggable>;
                    })
                )}
            </AccordionItem>
        </Accordion>
    );
};

export default ConditionalGroupField;
