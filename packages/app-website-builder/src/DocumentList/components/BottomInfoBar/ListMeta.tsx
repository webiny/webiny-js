import React, { useCallback } from "react";
import { Text } from "@webiny/admin-ui";

export interface ListMetaProps {
    loading: boolean;
    currentCount: number;
    totalCount: number;
}

export const ListMeta = (props: ListMetaProps) => {
    const getLabel = useCallback((count = 0): string => {
        return `${count} ${count === 1 ? "entry" : "entries"}`;
    }, []);

    if (props.loading) {
        return null;
    }

    return (
        <Text size={"sm"} as={"div"} className={"wby-text-neutral-strong"}>{`Showing ${
            props.currentCount
        } out of ${getLabel(props.totalCount)}.`}</Text>
    );
};
