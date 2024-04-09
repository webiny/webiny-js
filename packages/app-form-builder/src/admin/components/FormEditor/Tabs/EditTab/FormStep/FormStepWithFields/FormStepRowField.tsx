import React, { useCallback, useMemo } from "react";
import { FbFormModelField, FbFormStep } from "~/types";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import Field from "~/admin/components/FormEditor/Tabs/EditTab/Field";
import { FieldHandle, FieldContainer } from "~/admin/components/FormEditor/Tabs/EditTab/Styled";

import { Vertical } from "~/admin/components/FormEditor/DropZone";
import { useFormStep } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/useFormStep";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { useFormEditor } from "~/admin/components/FormEditor";

export interface FormStepFieldRowFieldProps {
    formStep: FbFormStep;
    row: FbFormModelField[];
    rowIndex: number;
    field: FbFormModelField;
    fieldIndex: number;
}

export const FormStepRowField = (props: FormStepFieldRowFieldProps) => {
    const { formStep, row, rowIndex, field, fieldIndex } = props;
    const { handleDrop, editField } = useFormStep();
    const { deleteField } = useFormEditor();

    const fieldBeginDragParams: BeginDragProps = useMemo(() => {
        return {
            ui: "field",
            name: field.name,
            id: field._id,
            pos: {
                row: rowIndex,
                index: fieldIndex
            },
            container: {
                type: "step",
                id: formStep.id
            }
        };
    }, [field, fieldIndex, formStep, rowIndex]);

    const onFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                formStep,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex
                }
            });

            return undefined;
        },
        [handleDrop, formStep, rowIndex, fieldIndex]
    );

    const onLastFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                formStep,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex + 1
                }
            });

            return undefined;
        },
        [handleDrop, formStep, rowIndex, fieldIndex]
    );

    const isLastField = fieldIndex === row.length - 1;

    return (
        <Draggable key={`step-field-${fieldIndex}`} beginDrag={fieldBeginDragParams}>
            {({ drag }) => (
                <FieldContainer ref={drag}>
                    <Vertical
                        onDrop={onFieldVerticalZoneDrop}
                        isVisible={item =>
                            item.ui === "field" && (row.length < 4 || item?.pos?.row === rowIndex)
                        }
                    />

                    <FieldHandle>
                        <Field
                            field={field}
                            onEdit={editField}
                            onDelete={() => deleteField(field, formStep.id)}
                        />
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
