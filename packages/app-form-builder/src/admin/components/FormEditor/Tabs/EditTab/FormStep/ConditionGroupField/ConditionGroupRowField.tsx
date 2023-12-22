import React, { useMemo, useCallback } from "react";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { FbFormModelField } from "~/types";
import { useConditionGroup } from "./useConditionGroup";
import { FieldContainer, FieldHandle } from "../../Styled";
import { Vertical } from "~/admin/components/FormEditor/DropZone";
import Field from "../../Field";
import { useFormEditor } from "~/admin/components/FormEditor/Context";

export interface ConditionGroupRowFieldProps {
    conditionGroup: FbFormModelField;
    row: FbFormModelField[];
    rowIndex: number;
    field: FbFormModelField;
    fieldIndex: number;
}

export const ConditionGroupRowField = (props: ConditionGroupRowFieldProps) => {
    const { conditionGroup, row, rowIndex, field, fieldIndex } = props;

    const { handleDrop, editField } = useConditionGroup();
    const { deleteField } = useFormEditor();

    const beginFieldDragParams: BeginDragProps = useMemo(() => {
        return {
            ui: "field",
            name: field.name,
            id: field._id,
            pos: {
                row: rowIndex,
                index: fieldIndex
            },
            container: {
                type: "conditionGroup",
                id: conditionGroup._id
            }
        };
    }, [field, fieldIndex, conditionGroup, rowIndex]);

    const onFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                conditionGroup,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex
                }
            });

            return undefined;
        },
        [handleDrop, conditionGroup, rowIndex, fieldIndex]
    );

    const onLastFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                conditionGroup,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex + 1
                }
            });

            return undefined;
        },
        [handleDrop, conditionGroup, rowIndex, fieldIndex]
    );

    const onDeleteField = useCallback(() => {
        deleteField({
            field,
            containerId: conditionGroup._id || "",
            containerType: "conditionGroup"
        });
    }, [field, conditionGroup]);

    const isLastField = fieldIndex === row.length - 1;

    return (
        <Draggable beginDrag={beginFieldDragParams} key={`condition-group-field-${fieldIndex}`}>
            {({ drag }) => (
                <FieldContainer ref={drag}>
                    <Vertical
                        onDrop={onFieldVerticalZoneDrop}
                        isVisible={item =>
                            item.ui === "field" && (row.length < 4 || item?.pos?.row === rowIndex)
                        }
                    />

                    <FieldHandle>
                        <Field field={field} onEdit={editField} onDelete={() => onDeleteField()} />
                    </FieldHandle>

                    {isLastField && (
                        <Vertical
                            last
                            isVisible={item =>
                                item.ui === "field" &&
                                (row.length < 4 || item?.pos?.row === rowIndex)
                            }
                            onDrop={onLastFieldVerticalZoneDrop}
                        />
                    )}
                </FieldContainer>
            )}
        </Draggable>
    );
};
