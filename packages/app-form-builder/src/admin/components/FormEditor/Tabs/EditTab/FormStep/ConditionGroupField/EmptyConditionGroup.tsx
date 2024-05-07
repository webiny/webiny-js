import React, { useCallback } from "react";

import { useConditionGroup } from "./useConditionGroup";

import { FbFormModelField } from "~/types";
import { Center } from "~/admin/components/FormEditor/DropZone";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";

interface EmptyConditionGroupProps {
    conditionGroupField: FbFormModelField;
}

export const EmptyConditionGroup = (props: EmptyConditionGroupProps) => {
    const { conditionGroupField } = props;
    const { handleDrop } = useConditionGroup();

    const onFieldVerticalZoneDrop = useCallback(
        (item: DragObjectWithFieldInfo) => {
            handleDrop({
                item,
                conditionGroup: conditionGroupField,
                destinationPosition: {
                    row: 0,
                    index: 0
                }
            });

            return undefined;
        },
        [handleDrop, conditionGroupField]
    );

    return <Center onDrop={onFieldVerticalZoneDrop}>{`Drop your first field here`}</Center>;
};
