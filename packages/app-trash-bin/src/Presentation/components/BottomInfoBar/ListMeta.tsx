import React, { useCallback } from "react";

export interface ListMetaProps {
    loading: boolean;
    currentCount: number;
    totalCount: number;
}

export const ListMeta = (props: ListMetaProps) => {
    const getLabel = useCallback((count = 0): string => {
        return `${count} ${count === 1 ? "item" : "items"}`;
    }, []);

    if (props.loading) {
        return null;
    }

    return <span>{`Showing ${props.currentCount} out of ${getLabel(props.totalCount)}.`}</span>;
};
