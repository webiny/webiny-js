import React from "react";
import { LocationAction } from "./RestoredItems.styled";

export interface RestoreItemsReportMessageProps {
    onLocationClick: () => void;
}

export const RestoreItemsReportMessage = (props: RestoreItemsReportMessageProps) => {
    return (
        <>
            Item successfully restored (
            <LocationAction onClick={() => props.onLocationClick()}>
                {"see location"}
            </LocationAction>
            ).
        </>
    );
};
