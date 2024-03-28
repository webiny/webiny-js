import React from "react";
import styled from "@emotion/styled";
import { makeDecoratable } from "@webiny/app-admin";

const StyledDivider = styled.div`
    width: 1px;
    margin: 0 5px;
    height: 100%;
    flex: none;
    background-color: var(--mdc-theme-on-background);
`;

export const Divider = makeDecoratable("TopBarDivider", () => {
    return <StyledDivider />;
});
