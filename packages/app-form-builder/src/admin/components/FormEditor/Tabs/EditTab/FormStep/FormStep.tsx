import React, { useCallback, useState } from "react";
import cloneDeep from "lodash/cloneDeep";

import {
    FbFormModelField,
    FieldLayoutPositionType,
    FbBuilderFieldPlugin,
    MoveFieldParams,
    FbFormModel,
    FbFormStep
} from "~/types";
import Draggable from "../../../Draggable";
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
import { ReactComponent as HandleIcon } from "../../../../../icons/round-drag_indicator-24px.svg";
import { Center, Vertical, Horizontal } from "../../../DropZone";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormsApp.Editor.EditTab");

export const FormStep = ({
    title,
    deleteStepDisabled,
    data,
    formStep,
    onDelete,
    onEdit,
    moveRow,
    moveField,
    getFieldPlugin,
    insertField,
    getLayoutFields,
    updateField,
    deleteField
}: {
    title: string;
    deleteStepDisabled: boolean;
    data: FbFormModel;
    formStep: FbFormStep;
    onDelete: () => void;
    onEdit: () => void;
    moveRow: (
        source: number,
        destination: number,
        targetStepId: string,
        sourceStep: FbFormStep
    ) => void;
    moveField: (params: MoveFieldParams) => void;
    getFieldPlugin: ({ name }: { name: string }) => FbBuilderFieldPlugin | null;
    insertField: (
        field: FbFormModelField,
        position: FieldLayoutPositionType,
        stepId: string
    ) => void;
    getLayoutFields: (stepId: string) => FbFormModelField[][];
    updateField: (field: FbFormModelField) => void;
    deleteField: (field: FbFormModelField, stepId: string) => void;
}) => {
    const [editingField, setEditingField] = useState<FbFormModelField | null>(null);
    const [dropTarget, setDropTarget] = useState<FieldLayoutPositionType | null>(null);

    const editField = useCallback((field: FbFormModelField | null) => {
        if (!field) {
            setEditingField(null);
            return;
        }
        setEditingField(cloneDeep(field));
    }, []);

    // TODO @ts-refactor figure out source type
    const handleDropField = useCallback(
        (source: any, position: FieldLayoutPositionType): void => {
            const { pos, name, ui, formStep: sourceStep } = source;

            if (name === "custom") {
                /**
                 * We can cast because field is empty in the start
                 */
                editField({} as FbFormModelField);
                setDropTarget(position);
                return;
            }

            if (ui === "row") {
                // Reorder rows.
                // Reorder logic is different depending on the source and target position.
                // pos.formStep is a source step from which we move row.
                // formStep is a target step in which we move row.
                moveRow(pos.row, position.row, formStep.id, sourceStep);
                return;
            }

            // If source pos is set, we are moving an existing field.
            if (pos) {
                if (pos.index === null) {
                    console.log("Tried to move Form Field but its position index is null.");
                    console.log(source);
                    return;
                }
                // Here we are getting field from the source step ("source step" is a step from which we take a field)
                const fieldId = sourceStep.layout[pos.row][pos.index];
                moveField({
                    field: fieldId,
                    position,
                    targetStepId: formStep.id,
                    sourceStepId: sourceStep.id
                });
                return;
            }

            // Find field plugin which handles the dropped field type "name".
            const plugin = getFieldPlugin({ name });
            if (!plugin) {
                return;
            }
            insertField(plugin.field.createField(), position, formStep.id);
        },
        [data]
    );

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
                                // We don't want to drop steps inside of steps
                                if (item.ui === "step") {
                                    return undefined;
                                }
                                handleDropField(item, {
                                    row: 0,
                                    index: 0
                                });
                                return undefined;
                            }}
                        >
                            {t`Drop your first field here`}
                        </Center>
                    )}
                    {fields.map((row, index) => (
                        <Draggable
                            beginDrag={{ ui: "row", pos: { row: index }, formStep }}
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
                                            handleDropField(item, {
                                                row: index,
                                                index: null
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
                                                    pos: {
                                                        row: index,
                                                        index: fieldIndex
                                                    },
                                                    formStep
                                                }}
                                            >
                                                {({ drag }) => (
                                                    <div className={fieldContainer} ref={drag}>
                                                        <Vertical
                                                            onDrop={item => {
                                                                handleDropField(item, {
                                                                    row: index,
                                                                    index: fieldIndex
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
                                                                    handleDropField(item, {
                                                                        row: index,
                                                                        index: fieldIndex + 1
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
                                                handleDropField(item, {
                                                    row: index + 1,
                                                    index: null
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
                            } else if (!dropTarget) {
                                console.log("Missing drop target on EditFieldDialog submit.");
                            } else {
                                insertField(data, dropTarget, formStep.id);
                            }
                            editField(null);
                        }}
                    />
                </StyledAccordionItem>
            </StyledAccordion>
        </div>
    );
};
