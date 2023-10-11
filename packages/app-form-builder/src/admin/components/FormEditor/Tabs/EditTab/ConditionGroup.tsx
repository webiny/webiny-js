import React from "react";
import { ReactComponent as EditIcon } from "../../icons/edit.svg";
import { ReactComponent as DeleteIcon } from "../../icons/delete.svg";
import { useFormEditor } from "../../Context";
import { FbFormModelField, FbFormStep } from "~/types";
import { Accordion } from "@webiny/ui/Accordion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Center, Vertical, Horizontal } from "../../DropZone";
import Field from "./Field";
import { RowContainer, rowHandle, Row, fieldContainer, StepRulesTag } from "./Styled";
import Draggable from "../../Draggable";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "../../../../icons/round-drag_indicator-24px.svg";
interface FieldProps {
    field: FbFormModelField;
    onEdit: (field: FbFormModelField) => void;
    onDelete: ({
        field,
        containerId,
        containerType
    }: {
        field: FbFormModelField;
        containerId: string;
        containerType?: "conditionGroup" | "step";
    }) => void;
    onDrop: any;
    targetStepId: string;
    formStep: FbFormStep;
    deleteConditionGroup: ({
        formStep,
        conditionGroup
    }: {
        formStep: FbFormStep;
        conditionGroup: FbFormModelField;
    }) => void;
}

const ConditionalGroupField: React.FC<FieldProps> = props => {
    const {
        field: conditionGroupField,
        onEdit,
        onDrop,
        deleteConditionGroup,
        onDelete,
        formStep
    } = props;
    const { getField } = useFormEditor();

    const getFields = () => {
        return (conditionGroupField?.settings?.layout || []).map((row: any) => {
            return row
                .map((id: any) => {
                    return getField({
                        _id: id
                    });
                })
                .filter(Boolean) as FbFormModelField[];
        });
    };

    const fields = getFields().map((fields: any) =>
        fields
            .filter((fiel: any) => fiel._id !== conditionGroupField._id)
            .filter((field: any) => field.length !== 0)
    ) as FbFormModelField[][];

    return (
        <Accordion>
            <AccordionItem
                title={conditionGroupField.label || ""}
                open={true}
                actions={
                    <AccordionItem.Actions>
                        {conditionGroupField.settings.rules?.length ? (
                            <StepRulesTag isValid={true}>{"Rules Attached"}</StepRulesTag>
                        ) : (
                            <></>
                        )}
                        <AccordionItem.Action
                            icon={<EditIcon />}
                            onClick={() => onEdit(conditionGroupField)}
                        />
                        <AccordionItem.Action
                            icon={<DeleteIcon />}
                            onClick={() => {
                                deleteConditionGroup({
                                    formStep,
                                    conditionGroup: conditionGroupField
                                });
                            }}
                        />
                    </AccordionItem.Actions>
                }
            >
                {fields.length === 0 ? (
                    <Center
                        onDrop={item => {
                            if (item.ui == "step") {
                                return;
                            }
                            onDrop({
                                target: {
                                    type: item.ui,
                                    id: item.id,
                                    name: item.name
                                },
                                source: {
                                    containerId: item?.container?.id,
                                    containerType: item?.container?.type || "conditionGroup",
                                    position: item.pos
                                },
                                destination: {
                                    containerId: conditionGroupField._id,
                                    containerType: "conditionGroup",
                                    position: {
                                        row: 0,
                                        index: 0
                                    }
                                }
                            });
                            return undefined;
                        }}
                    >
                        {`Drop your first field here`}
                    </Center>
                ) : (
                    fields.map((row, index) => {
                        return (
                            <Draggable
                                beginDrag={{
                                    ui: "row",
                                    pos: { row: index },
                                    container: {
                                        type: "conditionGroup",
                                        id: conditionGroupField._id || ""
                                    }
                                }}
                                key={`row-${index}`}
                            >
                                {({ drag, isDragging }) => (
                                    <RowContainer
                                        style={{
                                            opacity: isDragging ? 0.3 : 1,
                                            border: "none",
                                            background: "transparent",
                                            boxShadow: "none"
                                        }}
                                    >
                                        <div className={rowHandle} ref={drag}>
                                            <Icon icon={<HandleIcon />} />
                                        </div>
                                        <Horizontal
                                            onDrop={item => {
                                                onDrop({
                                                    target: {
                                                        type: item.ui,
                                                        id: item.id,
                                                        name: item.name
                                                    },
                                                    source: {
                                                        containerId: item?.container?.id,
                                                        containerType:
                                                            item?.container?.type ||
                                                            "conditionGroup",
                                                        position: item.pos
                                                    },
                                                    destination: {
                                                        containerId: conditionGroupField._id,
                                                        containerType: "conditionGroup",
                                                        position: {
                                                            row: index,
                                                            index: null
                                                        }
                                                    }
                                                });
                                                return undefined;
                                            }}
                                            isVisible={target => {
                                                const isVisible =
                                                    target.ui !== "step" &&
                                                    target.name !== "conditionGroup";
                                                return isVisible;
                                            }}
                                        />
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
                                                        container: {
                                                            type: "conditionGroup",
                                                            id: conditionGroupField._id || ""
                                                        }
                                                    }}
                                                >
                                                    {({ drag }) => (
                                                        <div className={fieldContainer} ref={drag}>
                                                            <Vertical
                                                                onDrop={item => {
                                                                    onDrop({
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
                                                                                    ?.type ||
                                                                                "conditionGroup",
                                                                            position: item.pos
                                                                        },
                                                                        destination: {
                                                                            containerId:
                                                                                conditionGroupField._id,
                                                                            containerType:
                                                                                "conditionGroup",
                                                                            position: {
                                                                                row: index,
                                                                                index: fieldIndex
                                                                            }
                                                                        }
                                                                    });
                                                                    return undefined;
                                                                }}
                                                                isVisible={target => {
                                                                    const isVisible =
                                                                        target.ui !== "step" &&
                                                                        target.ui !== "row" &&
                                                                        target.name !==
                                                                            "conditionGroup";
                                                                    return isVisible;
                                                                }}
                                                            />
                                                            <Field
                                                                field={field}
                                                                onEdit={onEdit}
                                                                onDelete={() => {
                                                                    onDelete({
                                                                        field,
                                                                        containerId:
                                                                            conditionGroupField._id ||
                                                                            "",
                                                                        containerType:
                                                                            "conditionGroup"
                                                                    });
                                                                }}
                                                            />

                                                            {/* Field end */}
                                                            {fieldIndex === row.length - 1 && (
                                                                <Vertical
                                                                    last
                                                                    isVisible={target => {
                                                                        const condition =
                                                                            row.length < 4 ||
                                                                            target.pos.row ===
                                                                                index;
                                                                        const isVisible =
                                                                            target.ui === "field" &&
                                                                            target.name !==
                                                                                "conditionGroup";
                                                                        return (
                                                                            isVisible && condition
                                                                        );
                                                                    }}
                                                                    onDrop={item => {
                                                                        onDrop({
                                                                            target: {
                                                                                type: item.ui,
                                                                                id: item.id,
                                                                                name: item.name
                                                                            },
                                                                            source: {
                                                                                containerId:
                                                                                    item?.container
                                                                                        ?.id,
                                                                                containerType:
                                                                                    item?.container
                                                                                        ?.type ||
                                                                                    "conditionGroup",
                                                                                position: item.pos
                                                                            },
                                                                            destination: {
                                                                                containerId:
                                                                                    conditionGroupField._id,
                                                                                containerType:
                                                                                    "conditionGroup",
                                                                                position: {
                                                                                    row: index,
                                                                                    index:
                                                                                        fieldIndex +
                                                                                        1
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
                                                    onDrop({
                                                        target: {
                                                            type: item.ui,
                                                            id: item.id,
                                                            name: item.name
                                                        },
                                                        source: {
                                                            containerId: item?.container?.id,
                                                            containerType:
                                                                item?.container?.type ||
                                                                "conditionGroup",
                                                            position: item.pos
                                                        },
                                                        destination: {
                                                            containerId: conditionGroupField._id,
                                                            containerType: "conditionGroup",
                                                            position: {
                                                                row: index + 1,
                                                                index: null
                                                            }
                                                        }
                                                    });
                                                    return undefined;
                                                }}
                                                isVisible={target => {
                                                    const isVisible =
                                                        target.ui !== "step" &&
                                                        target.name !== "conditionGroup";
                                                    return isVisible;
                                                }}
                                            />
                                        )}
                                    </RowContainer>
                                )}
                            </Draggable>
                        );
                    })
                )}
            </AccordionItem>
        </Accordion>
    );
};

export default ConditionalGroupField;
