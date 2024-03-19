import React, { useCallback } from "react";

export interface ListMetaProps {
    currentCount: number;
    totalCount: number;
}

export const ListMeta = (props: ListMetaProps) => {
    const getLabel = useCallback((count = 0): string => {
        return `${count} ${count === 1 ? "item" : "items"}`;
    }, []);

    return (
        <span>{`Showing ${getLabel(props.currentCount)} of ${getLabel(props.totalCount)}.`}</span>
    );
};
