// @flow
import * as React from "react";
import { Typography } from "webiny-ui/Typography";
import styled from "react-emotion";

const NoDataWrapper = styled("div")({
    textAlign: "center",
    padding: 100,
    color: "var(--mdc-theme-on-surface)"
});

const NoData = () => (
    <NoDataWrapper>
        <Typography use="overline">No records found.</Typography>
    </NoDataWrapper>
);

export default NoData;
