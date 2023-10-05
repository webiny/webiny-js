import React, { useCallback, useState } from "react";
import cloneDeep from "lodash/cloneDeep";

import {
    FbFormModelField,
    FbBuilderFieldPlugin,
    FbFormModel,
    FbFormStep,
    DropTarget,
    DropSource,
    DropDestination
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
    StyledAccordionItem,
    conditionGroupContainer
} from "../Styled";

import { Icon } from "@webiny/ui/Icon";
import { AccordionItem } from "@webiny/ui/Accordion";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_outline.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/outlined/edit.svg";
import { ReactComponent as HandleIcon } from "../../../../../icons/round-drag_indicator-24px.svg";
import { Center, Vertical, Horizontal } from "../../../DropZone";
import ConditionalGroupField from "../ConditionGroup";

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
    deleteField,
    deleteConditionGroup
}: {
    title: string;
    deleteStepDisabled: boolean;
    data: FbFormModel;
    formStep: FbFormStep;
    onDelete: () => void;
    onEdit: () => void;
    moveRow: (
        sourceRow: number,
        destinationRow: number,
        source: DropSource,
        destination: DropDestination
    ) => void;
    moveField: ({
        target,
        field,
        source,
        destination
    }: {
        target: DropTarget;
        field: FbFormModelField | string;
        source: DropSource;
        destination: DropDestination;
    }) => void;
    getFieldPlugin: ({ name }: { name: string }) => FbBuilderFieldPlugin | null;
    insertField: ({
        data,
        target,
        destination,
        source
    }: {
        data: FbFormModelField;
        target: DropTarget;
        destination: DropDestination;
        source?: DropSource;
    }) => void;
    getLayoutFields: (stepId: string) => FbFormModelField[][];
    updateField: (field: FbFormModelField) => void;
    deleteField: ({
        field,
        containerType,
        containerId
    }: {
        field: FbFormModelField;
        containerType?: "conditionGroup" | "step";
        containerId: string;
    }) => void;
    deleteConditionGroup: ({
        formStep,
        conditionGroup
    }: {
        formStep: FbFormStep;
        conditionGroup: FbFormModelField;
    }) => void;
}) => {
    const [editingField, setEditingField] = useState<FbFormModelField | null>(null);
    const [dropTarget, setDropTarget] = useState<DropDestination | null>(null);

    const editField = useCallback((field: FbFormModelField | null) => {
        if (!field) {
            setEditingField(null);
            return;
        }
        setEditingField(cloneDeep(field));
    }, []);

    const handleDrop = useCallback(
        ({
            target,
            source,
            destination
        }: {
            target: DropTarget;
            source: DropSource;
            destination: DropDestination;
        }) => {
            if (target.name === "custom" || target.name === "conditionGroup") {
                /**
                 * We can cast because field is empty in the start
                 */
                editField({} as FbFormModelField);
                setDropTarget(destination);
                return;
            }

            if (target.type === "row") {
                // Reorder rows.
                // Reorder logic is different depending on the source and target position.
                // pos.formStep is a source step from which we move row.
                // formStep is a target step in which we move row.
                moveRow(source.position.row, destination.position.row, source, destination);
                return;
            }

            if (source.position) {
                if (source.position.index === null) {
                    console.log("Tried to move Form Field but its position index is null.");
                    console.log(source);
                    return;
                }
                const sourceContainer =
                    source.containerType === "conditionGroup"
                        ? (data.fields.find(f => f._id === source.containerId)
                              ?.settings as FbFormStep)
                        : (data.steps.find(step => step.id === source.containerId) as FbFormStep);

                const fieldId = sourceContainer?.layout[source.position.row][source.position.index];
                if (!fieldId) {
                    console.log("Missing data when moving field.");
                    return;
                }
                moveField({ field: fieldId, target, source, destination });
                return;
            }

            // Find field plugin which handles the dropped field type "name".
            const plugin = getFieldPlugin({ name: target.name });
            if (!plugin) {
                return;
            }
            insertField({
                data: plugin.field.createField(),
                target,
                destination,
                source
            });
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
                                // We don't want to drop steps inside of steps.
                                if (item.ui === "step") {
                                    return undefined;
                                }
                                handleDrop({
                                    target: {
                                        type: item.ui,
                                        id: item.id,
                                        name: item.name
                                    },
                                    source: {
                                        containerId: item?.container?.id,
                                        containerType: item?.container?.type,
                                        position: item.pos
                                    },
                                    destination: {
                                        containerId: formStep.id,
                                        containerType: "step",
                                        position: {
                                            row: 0,
                                            index: 0
                                        }
                                    }
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
                                            handleDrop({
                                                target: {
                                                    type: item.ui,
                                                    id: item.id,
                                                    name: item.name
                                                },
                                                source: {
                                                    containerId: item?.container?.id,
                                                    containerType: item?.container?.type,
                                                    position: item.pos
                                                },
                                                destination: {
                                                    containerId: formStep.id,
                                                    containerType: "step",
                                                    position: {
                                                        row: index,
                                                        index: null
                                                    }
                                                }
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
                                                    <div
                                                        className={
                                                            field.name === "conditionGroup"
                                                                ? conditionGroupContainer
                                                                : fieldContainer
                                                        }
                                                        ref={drag}
                                                    >
                                                        <Vertical
                                                            onDrop={item => {
                                                                handleDrop({
                                                                    target: {
                                                                        type: item.ui,
                                                                        id: item.id,
                                                                        name: item.name
                                                                    },
                                                                    source: {
                                                                        containerId:
                                                                            item?.container?.id,
                                                                        containerType:
                                                                            item?.container?.type,
                                                                        position: item.pos
                                                                    },
                                                                    destination: {
                                                                        containerId: formStep.id,
                                                                        containerType: "step",
                                                                        position: {
                                                                            row: index,
                                                                            index: fieldIndex
                                                                        }
                                                                    }
                                                                });
                                                                return undefined;
                                                            }}
                                                            isVisible={item =>
                                                                item.ui === "field" &&
                                                                (row.length < 4 ||
                                                                    item?.pos?.row === index)
                                                            }
                                                        />

                                                        {field.name === "conditionGroup" ? (
                                                            <div>
                                                                <ConditionalGroupField
                                                                    field={field}
                                                                    onEdit={editField}
                                                                    targetStepId={formStep.id}
                                                                    onDelete={deleteField}
                                                                    deleteConditionGroup={
                                                                        deleteConditionGroup
                                                                    }
                                                                    onDrop={handleDrop}
                                                                    formStep={formStep}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className={fieldHandle}>
                                                                <Field
                                                                    field={field}
                                                                    onEdit={editField}
                                                                    onDelete={() =>
                                                                        deleteField({
                                                                            field,
                                                                            containerId:
                                                                                formStep.id,
                                                                            containerType: "step"
                                                                        })
                                                                    }
                                                                />
                                                            </div>
                                                        )}

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
                                                                    handleDrop({
                                                                        target: {
                                                                            type: item.ui,
                                                                            id: item.id,
                                                                            name: item.name
                                                                        },
                                                                        source: {
                                                                            containerId:
                                                                                item?.container?.id,
                                                                            containerType:
                                                                                item?.container
                                                                                    ?.type,
                                                                            position: item.pos
                                                                        },
                                                                        destination: {
                                                                            containerId:
                                                                                formStep.id,
                                                                            containerType: "step",
                                                                            position: {
                                                                                row: index,
                                                                                index:
                                                                                    fieldIndex + 1
                                                                            }
                                                                        }
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
                                                handleDrop({
                                                    target: {
                                                        type: item.ui,
                                                        id: item.id,
                                                        name: item.name
                                                    },
                                                    source: {
                                                        containerId: item?.container?.id,
                                                        containerType: item?.container?.type,
                                                        position: item.pos
                                                    },
                                                    destination: {
                                                        containerId: formStep.id,
                                                        containerType: "step",
                                                        position: {
                                                            row: index + 1,
                                                            index: null
                                                        }
                                                    }
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
                                /*
                                    Here we are inserting a custom field.
                                */
                                insertField({
                                    data,
                                    target: {
                                        id: data._id,
                                        type: "field",
                                        name: data.name
                                    },
                                    destination: {
                                        containerType: dropTarget.containerType,
                                        containerId: dropTarget.containerId,
                                        position: dropTarget.position
                                    }
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
