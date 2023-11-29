import React, { useCallback, useMemo } from "react";
import { FbFormModelField, FbFormStep } from "~/types";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import { RowHandle, Row, RowContainer } from "../../Styled";

import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "~/admin/components/FormEditor/icons/round-drag_indicator-24px.svg";
import { Horizontal } from "~/admin/components/FormEditor/DropZone";
import { useFormStep } from "~/admin/components/FormEditor/Tabs/EditTab/FormStep/useFormStep";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { FormStepRowField } from "./FormStepRowField";

export interface FormStepRowProps {
    formStep: FbFormStep;
    rowIndex: number;
    row: FbFormModelField[];
    isLastRow: boolean;
}

export const FormStepRow: React.FC<FormStepRowProps> = ({ formStep, isLastRow, row, rowIndex }) => {
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
