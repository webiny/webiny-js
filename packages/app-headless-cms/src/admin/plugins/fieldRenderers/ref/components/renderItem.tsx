import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { createEntryUrl } from "~/admin/plugins/fieldRenderers/ref/components/createEntryUrl";
import { Link } from "@webiny/react-router";

const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

export interface Props {
    name: string;
    modelName: string;
    modelId: string;
    id: string;
}
export const renderItem = (props: Props) => {
    return (
        <Typography use={"body2"}>
            <Link to={createEntryUrl(props)}>{props.name}</Link>
            <br />
            <ModelId>Model: {props.modelName}</ModelId>
        </Typography>
    );
};
