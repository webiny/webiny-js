import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";

const ModelId = styled("span")({
    color: "var(--mdc-theme-text-secondary-on-background) !important"
});

export const renderItem = item => {
    return (
        <Typography use={"body2"}>
            {item.name}
            <br />
            <ModelId>Model: {item.modelName}</ModelId>
        </Typography>
    );
};
