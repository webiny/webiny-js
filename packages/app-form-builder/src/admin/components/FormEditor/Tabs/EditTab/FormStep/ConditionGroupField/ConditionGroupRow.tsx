import React, { useCallback, useMemo } from "react";
import { FbFormModelField } from "~/types";
import { useConditionGroup } from "./useConditionGroup";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import Draggable, { BeginDragProps } from "~/admin/components/FormEditor/Draggable";
import { Row, RowContainer, RowHandle } from "../../Styled";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HandleIcon } from "~/admin/components/FormEditor/icons/round-drag_indicator-24px.svg";
import { Horizontal } from "~/admin/components/FormEditor/DropZone";
import { ConditionGroupRowField } from "./ConditionGroupRowField";

export interface ConditionalGroupRowProps {
    conditionGroup: FbFormModelField;
    row: FbFormModelField[];
    rowIndex: number;
    isLastRow: boolean;
}

export const ConditionalGroupRow = (props: ConditionalGroupRowProps) => {
    const { conditionGroup, row, rowIndex, isLastRow } = props;

    const { handleDrop } = useConditionGroup();

    const rowBeginDragParams: BeginDragProps = useMemo(() => {
        return {
            ui: "row",
            pos: { row: rowIndex },
            container: {
                type: "conditionGroup",
                id: conditionGroup._id
            }
        };
    }, [rowIndex, conditionGroup]);

    const onRowHorizontalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                conditionGroup,
                destinationPosition: {
                    row: rowIndex,
                    index: null
                }
            });

            return undefined;
        },
        [handleDrop, conditionGroup, rowIndex]
    );

    const onLastRowHorizontalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                conditionGroup,
                destinationPosition: {
                    row: rowIndex + 1,
                    index: null
                }
            });

            return undefined;
        },
        [handleDrop, conditionGroup, rowIndex]
    );

    return (
        <Draggable beginDrag={rowBeginDragParams} key={`condition-group-row${rowIndex}`}>
            {({ drag, isDragging }) => (
                <RowContainer isDragging={isDragging}>
                    <RowHandle ref={drag}>
                        <Icon icon={<HandleIcon />} />
                    </RowHandle>
                    <Horizontal
                        onDrop={onRowHorizontalZoneDrop}
                        isVisible={item => item.ui !== "step" && item.ui !== "conditionGroup"}
                    />

                    {/* Row start - includes field drop zones and fields */}
                    <Row>
                        {row.map((field, fieldIndex) => (
                            <ConditionGroupRowField
                                key={`condition-group-row-field${fieldIndex}`}
                                field={field}
                                fieldIndex={fieldIndex}
                                row={row}
                                rowIndex={rowIndex}
                                conditionGroup={conditionGroup}
                            />
                        ))}
                    </Row>

                    {/* Row end */}
                    {isLastRow && (
                        <Horizontal
                            last
                            onDrop={onLastRowHorizontalZoneDrop}
                            isVisible={item => item.ui !== "step" && item.ui !== "conditionGroup"}
                        />
                    )}
                </RowContainer>
            )}
        </Draggable>
    );
};
