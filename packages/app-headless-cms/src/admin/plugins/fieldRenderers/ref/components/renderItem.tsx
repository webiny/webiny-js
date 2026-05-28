import React from "react";
import styled from "@emotion/styled";
import { Text } from "@webiny/admin-ui";
import { createEntryUrl } from "./createEntryUrl.js";
import { SimpleLink } from "@webiny/app-admin";
import type { OptionItem } from "./types.js";
import { EntryStatus } from "./EntryStatus.js";
import { IconButton } from "@webiny/admin-ui";
import { css } from "@emotion/css";

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
        <Text size={"sm"}>
            <SimpleLink to={createEntryUrl(props)}>{props.name}</SimpleLink>
            <br />
            <ModelId>Model: {props.modelName}</ModelId>
        </Text>
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
