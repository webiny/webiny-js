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
        <div className="flex items-center gap-sm">
            <Text size={"sm"} as={"div"} className={"text-neutral-strong"}>
                {"Loading more redirects..."}
            </Text>
            <Loader size={"xs"} />
        </div>
    );
};
