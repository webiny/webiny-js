import React, { useCallback, useMemo } from "react";
import { FbFormModelField, FbFormStep } from "~/types";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import Field from "../Field";
import { RowHandle, FieldHandle, FieldContainer, Row, RowContainer } from "../Styled";

import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "~/admin/components/FormEditor/icons/round-drag_indicator-24px.svg";
import { Vertical, Horizontal } from "~/admin/components/FormEditor/DropZone";
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

export const FormStepRowField: React.FC<FormStepFieldRowFieldProps> = props => {
    const { formStep, row, rowIndex, field, fieldIndex } = props;
    const { onFormStepDrop, editField } = useFormStep();
    const { deleteField } = useFormEditor();

    const fieldBeginDragParams = useMemo<BeginDragProps>(() => {
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
    }, [field, rowIndex, fieldIndex, formStep]);

    const onFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex
                },
                formStep
            }),
        [rowIndex, fieldIndex, formStep]
    );

    const onLastFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex,
                    index: fieldIndex + 1
                },
                formStep
            }),
        []
    );

    const isLastField = fieldIndex === row.length - 1;

    return (
        <Draggable key={`field-${fieldIndex}`} beginDrag={fieldBeginDragParams}>
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

export interface FormStepFieldProps {
    formStep: FbFormStep;
    rowIndex: number;
    row: FbFormModelField[];
    isLastRow: boolean;
}

export const FormStepRow: React.FC<FormStepFieldProps> = ({
    formStep,
    isLastRow,
    row,
    rowIndex
}) => {
    const { onFormStepDrop } = useFormStep();

    const rowBeginDragParams = useMemo<BeginDragProps>(() => {
        return {
            ui: "row",
            pos: { row: rowIndex },
            container: {
                type: "step",
                id: formStep.id
            }
        };
    }, [rowIndex, formStep]);

    const onRowHorizontalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) =>
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex,
                    index: null
                },
                formStep
            }),
        [rowIndex, formStep]
    );
    const onLastRowHorizontalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            onFormStepDrop({
                item,
                destinationPosition: {
                    row: rowIndex + 1,
                    index: null
                },
                formStep
            });
            return undefined;
        },
        [rowIndex, formStep]
    );

    return (
        <Draggable beginDrag={rowBeginDragParams} key={`row-${rowIndex}`}>
            {({ drag, isDragging }) => (
                /* RowContainer start - includes drag handle, drop zones and the Row itself. */
                <RowContainer isDragging={isDragging}>
                    <RowHandle ref={drag}>
                        <Icon icon={<HandleIcon />} />
                    </RowHandle>
                    <Horizontal
                        onDrop={onRowHorizontalZoneDrop}
                        isVisible={item => item.ui !== "step"}
                    />

                    {/* Row start - includes field drop zones and fields */}
                    <Row>
                        {row.map((field, fieldIndex) => (
                            <FormStepRowField
                                key={`field-${field._id}`}
                                formStep={formStep}
                                row={row}
                                rowIndex={rowIndex}
                                field={field}
                                fieldIndex={fieldIndex}
                            />
                        ))}
                    </Row>

                    {/* Row end */}
                    {isLastRow && (
                        <Horizontal
                            last
                            onDrop={onLastRowHorizontalZoneDrop}
                            isVisible={item => item.ui !== "step"}
                        />
                    )}
                </RowContainer>
            )}
        </Draggable>
    );
};

export interface FormStepWithFieldsProps {
    fields: FbFormModelField[][];
    formStep: FbFormStep;
}

export const FormStepWithFields: React.FC<FormStepWithFieldsProps> = ({ fields, formStep }) => {
    return (
        <>
            {fields.map((row, rowIndex) => (
                <FormStepRow
                    key={`row-${rowIndex}`}
                    row={row}
                    rowIndex={rowIndex}
                    formStep={formStep}
                    isLastRow={rowIndex === fields.length - 1}
                />
            ))}
        </>
    );
};
