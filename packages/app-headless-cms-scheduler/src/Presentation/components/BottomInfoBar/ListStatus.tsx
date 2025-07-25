import React from "react";
import { CircularProgress } from "@webiny/ui/Progress";
import { CircularProgressHolder, StatusWrapper, UploadingLabel } from "./BottomInfoBar.styled";

export interface ListStatusProps {
    loading: boolean;
}

export const ListStatus = ({ loading }: ListStatusProps) => {
    if (!loading) {
        return null;
    }

    return (
        <StatusWrapper>
            <UploadingLabel>{"Loading more items..."}</UploadingLabel>
            <CircularProgressHolder>
                <CircularProgress size={10} spinnerWidth={1} />
            </CircularProgressHolder>
        </StatusWrapper>
    );
};
