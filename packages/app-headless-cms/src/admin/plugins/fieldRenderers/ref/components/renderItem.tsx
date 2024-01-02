import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { createEntryUrl } from "./createEntryUrl";
import { Link } from "@webiny/react-router";
import { OptionItem } from "./types";
import { EntryStatus } from "./EntryStatus";
import { IconButton } from "@webiny/ui/Button";
import { css } from "emotion";

const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

const iconButtonClassName = css({
    verticalAlign: "top"
});

export interface RenderItemProps {
    name: string;
    modelName: string;
    modelId: string;
    id: string;
}
export const renderItem = (props: RenderItemProps) => {
    return (
        <Typography use={"body2"}>
            <Link to={createEntryUrl(props)}>{props.name}</Link>
            <br />
            <ModelId>Model: {props.modelName}</ModelId>
        </Typography>
    );
};

export const renderListItemOptions = (item: OptionItem) => {
    return (
        <IconButton
            icon={<EntryStatus item={item} placement={"top"} />}
            className={iconButtonClassName}
        />
    );
};
