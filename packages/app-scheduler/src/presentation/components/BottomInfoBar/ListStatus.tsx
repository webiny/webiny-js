import React from "react";
import { Loader } from "@webiny/admin-ui";
import { CircularProgressHolder, StatusWrapper, UploadingLabel } from "./BottomInfoBar.styled.js";

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
                <Loader size={"xs"} />
            </CircularProgressHolder>
        </StatusWrapper>
    );
};
