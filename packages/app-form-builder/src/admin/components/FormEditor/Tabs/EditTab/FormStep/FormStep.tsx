import React, { useCallback, useState } from "react";
import cloneDeep from "lodash/cloneDeep";

import { FbFormModelField, FbFormStep, DropDestination } from "~/types";
import Draggable from "~/admin/components/FormEditor/Draggable";
import EditFieldDialog from "../EditFieldDialog";
import Field from "../Field";
import {
    rowHandle,
    fieldHandle,
    fieldContainer,
    Row,
    RowContainer,
    StyledAccordion,
    StyledAccordionItem
} from "../Styled";

import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as HandleIcon } from "~/admin/components/FormEditor/icons/round-drag_indicator-24px.svg";
import { Center, Vertical, Horizontal } from "~/admin/components/FormEditor/DropZone";
import { useFormDragAndDrop } from "~/hooks/useFormDragAndDrop";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.Editor.EditTab");

export const FormStep = ({
    title,
    deleteStepDisabled,
    formStep,
    onDelete,
    onEdit,
    getLayoutFields,
    updateField,
    deleteField
}: {
    title: string;
    deleteStepDisabled: boolean;
    formStep: FbFormStep;
    onDelete: () => void;
    onEdit: () => void;
    getLayoutFields: (stepId: string) => FbFormModelField[][];
    updateField: (field: FbFormModelField) => void;
    deleteField: (field: FbFormModelField, stepId: string) => void;
}) => {
    const [editingField, setEditingField] = useState<FbFormModelField | null>(null);
    const [dropDestination, setDropDestination] = useState<DropDestination | null>(null);

    const editField = useCallback((field: FbFormModelField | null) => {
        if (!field) {
            setEditingField(null);
            return;
        }
        setEditingField(cloneDeep(field));
    }, []);

    const { composeHandleDropParams, createCustomField } = useFormDragAndDrop({
        editField,
        setDropDestination
    });

    const fields = getLayoutFields(formStep.id);

    return (
        <div style={{ marginLeft: "40px" }} data-testid="form-step-element">
            <StyledAccordion>
                <div className={rowHandle}>
                    <Icon icon={<HandleIcon />} />
                </div>
                <StyledAccordionItem
                    title={title}
                    open={true}
                    actions={
                        <AccordionItem.Actions>
                            <AccordionItem.Action icon={<EditIcon />} onClick={onEdit} />
                            <AccordionItem.Action
                                icon={<DeleteIcon />}
                                onClick={onDelete}
                                disabled={deleteStepDisabled}
                            />
                        </AccordionItem.Actions>
                    }
                >
                    {fields.length === 0 && (
                        <Center
                            onDrop={item => {
                                composeHandleDropParams({
                                    item,
                                    destinationPosition: {
                                        row: 0,
                                        index: 0
                                    },
                                    formStep
                                });
                                return undefined;
                            }}
                        >
                            {t`Drop your first field here`}
                        </Center>
                    )}
                    {fields.map((row, index) => (
                        <Draggable
                            beginDrag={{
                                ui: "row",
                                pos: { row: index },
                                container: {
                                    type: "step",
                                    id: formStep.id
                                }
                            }}
                            key={`row-${index}`}
                        >
                            {(
                                {
                                    drag,
                                    isDragging
                                } /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                            ) => (
                                <RowContainer
                                    style={{
                                        opacity: isDragging ? 0.3 : 1,
                                        border: "1px solid var(--mdc-theme-background)",
                                        boxShadow: "none"
                                    }}
                                >
                                    <div className={rowHandle} ref={drag}>
                                        <Icon icon={<HandleIcon />} />
                                    </div>
                                    <Horizontal
                                        onDrop={item => {
                                            composeHandleDropParams({
                                                item,
                                                destinationPosition: {
                                                    row: index,
                                                    index: null
                                                },
                                                formStep
                                            });
                                            return undefined;
                                        }}
                                        isVisible={item => item.ui !== "step"}
                                    />
                                    {/* Row start - includes field drop zones and fields */}
                                    <Row>
                                        {row.map((field, fieldIndex) => (
                                            <Draggable
                                                key={`field-${fieldIndex}`}
                                                beginDrag={{
                                                    ui: "field",
                                                    name: field.name,
                                                    id: field._id,
                                                    pos: {
                                                        row: index,
                                                        index: fieldIndex
                                                    },
                                                    container: {
                                                        type: "step",
                                                        id: formStep.id
                                                    }
                                                }}
                                            >
                                                {({ drag }) => (
                                                    <div className={fieldContainer} ref={drag}>
                                                        <Vertical
                                                            onDrop={item => {
                                                                composeHandleDropParams({
                                                                    item,
                                                                    destinationPosition: {
                                                                        row: index,
                                                                        index: fieldIndex
                                                                    },
                                                                    formStep
                                                                });
                                                                return undefined;
                                                            }}
                                                            isVisible={item =>
                                                                item.ui === "field" &&
                                                                (row.length < 4 ||
                                                                    item?.pos?.row === index)
                                                            }
                                                        />

                                                        <div className={fieldHandle}>
                                                            <Field
                                                                field={field}
                                                                onEdit={editField}
                                                                onDelete={() =>
                                                                    deleteField(field, formStep.id)
                                                                }
                                                            />
                                                        </div>

                                                        {/* Field end */}
                                                        {fieldIndex === row.length - 1 && (
                                                            <Vertical
                                                                last
                                                                isVisible={item =>
                                                                    item.ui === "field" &&
                                                                    (row.length < 4 ||
                                                                        item?.pos?.row === index)
                                                                }
                                                                onDrop={item => {
                                                                    composeHandleDropParams({
                                                                        item,
                                                                        destinationPosition: {
                                                                            row: index,
                                                                            index: fieldIndex + 1
                                                                        },
                                                                        formStep
                                                                    });
                                                                    return undefined;
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    </Row>
                                    {/* Row end */}
                                    {index === fields.length - 1 && (
                                        <Horizontal
                                            last
                                            onDrop={item => {
                                                composeHandleDropParams({
                                                    item,
                                                    destinationPosition: {
                                                        row: index + 1,
                                                        index: null
                                                    },
                                                    formStep
                                                });
                                                return undefined;
                                            }}
                                            isVisible={item => item.ui !== "step"}
                                        />
                                    )}
                                </RowContainer>
                            )}
                        </Draggable>
                    ))}
                    <EditFieldDialog
                        field={editingField}
                        onClose={() => {
                            editField(null);
                        }}
                        onSubmit={initialData => {
                            const data = initialData as unknown as FbFormModelField;

                            if (data._id) {
                                updateField(data);
                            } else if (!dropDestination) {
                                console.log("Missing drop target on EditFieldDialog submit.");
                            } else {
                                /*
                                    Here we are inserting a custom field.
                                */
                                createCustomField({
                                    data,
                                    dropDestination
                                });
                            }
                            editField(null);
                        }}
                    />
                </StyledAccordionItem>
            </StyledAccordion>
        </div>
    );
};
