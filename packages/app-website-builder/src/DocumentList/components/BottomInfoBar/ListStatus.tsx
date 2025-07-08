import React from "react";
import { Loader, Text } from "@webiny/admin-ui";

export interface ListStatusProps {
    loading: boolean;
}

export const ListStatus = ({ loading }: ListStatusProps) => {
    if (!loading) {
        return null;
    }

    return (
        <div className="wby-flex wby-items-center wby-gap-sm">
            <Text size={"sm"} as={"div"} className={"wby-text-neutral-strong"}>
                {"Loading more entries..."}
            </Text>
            <Loader size={"xs"} />
        </div>
    );
};
