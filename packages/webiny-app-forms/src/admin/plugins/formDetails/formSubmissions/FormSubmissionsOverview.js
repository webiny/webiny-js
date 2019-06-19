//@flow
import * as React from "react";
import Block from "./Block";
import { Typography } from "webiny-ui/Typography";
import styled from "react-emotion";

type Props = {
    form: Object
};

const StatBox = styled("div")({
    width: "33.33%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column"
});

const ContentWrapper = styled("div")({
    flexDirection: "row",
    display: "flex",
    width: "100%",
    boxSizing: "border-box"
});

const FormSubmissionsOverview = ({ form }: Props) => {
    return (
        <Block title="Overview">
            <ContentWrapper>
                <StatBox>
                    <Typography use="headline2">{form.stats.submissions}</Typography>
                    <Typography use="overline">Submissions</Typography>
                </StatBox>
                <StatBox>
                    <Typography use="headline2">{form.stats.views}</Typography>
                    <Typography use="overline">Views</Typography>
                </StatBox>
                <StatBox>
                    <Typography use="headline2">{form.stats.conversionRate}%</Typography>
                    <Typography use="overline">Conversion Rate</Typography>
                </StatBox>
            </ContentWrapper>
        </Block>
    );
};

export default FormSubmissionsOverview;
