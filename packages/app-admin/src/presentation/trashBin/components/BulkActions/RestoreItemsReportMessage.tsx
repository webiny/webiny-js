import React from "react";
import { Text } from "@webiny/admin-ui";

export interface RestoreItemsReportMessageProps {
    onLocationClick: () => void;
}

export const RestoreItemsReportMessage = (props: RestoreItemsReportMessageProps) => {
    return (
        <div className={"cursor-pointer"} onClick={() => props.onLocationClick()}>
            Item successfully restored (
            <Text size={"sm"} className={"text-accent-primary underline"}>
                {"see location"}
            </Text>
            ).
        </div>
    );
};
