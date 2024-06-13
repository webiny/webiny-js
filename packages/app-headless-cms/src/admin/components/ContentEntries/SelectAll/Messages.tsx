import React from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { getEntriesLabel } from "./SelectAll";

export interface MessagesProps {
    onClick: () => void;
    selectedLength: number;
    totalCount: number;
}

export const SelectAllMessage = (props: MessagesProps) => {
    return (
        <Typography use={"body1"}>
            {`All ${getEntriesLabel(props.selectedLength)} on this page are selected.`}
            <ButtonDefault small={true} onClick={props.onClick}>{`Select all ${getEntriesLabel(
                props.totalCount
            )}`}</ButtonDefault>
        </Typography>
    );
};

export const ClearSelectionMessage = (props: MessagesProps) => {
    return (
        <Typography use={"body1"}>
            {`All ${getEntriesLabel(props.selectedLength)} are selected.`}
            <ButtonDefault small={true} onClick={props.onClick}>{`Clear selection`}</ButtonDefault>
        </Typography>
    );
};
