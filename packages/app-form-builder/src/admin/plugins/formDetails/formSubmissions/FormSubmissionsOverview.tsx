import * as React from "react";
import Block from "./Block";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { FbFormOverallStats } from "~/types";

interface FormSubmissionsOverviewProps {
    stats: FbFormOverallStats;
}

const StatBox = styled("div")({
    width: "33.33%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    color: "var(--mdc-theme-on-surface)"
});

const ContentWrapper = styled("div")({
    flexDirection: "row",
    display: "flex",
    width: "100%",
    boxSizing: "border-box"
});

const calculateConversionRate = (submissions: number, views: number) => {
    return views > 0 ? parseFloat(((submissions / views) * 100).toFixed(2)) : 0;
};

export const FormSubmissionsOverview = ({ stats }: FormSubmissionsOverviewProps) => {
    const conversionRate = calculateConversionRate(stats.submissions, stats.views);

    return (
        <Block title="Overview">
            <ContentWrapper>
                <StatBox>
                    <Typography use="headline2">{stats.submissions}</Typography>
                    <Typography use="overline">Submissions</Typography>
                </StatBox>
                <StatBox>
                    <Typography use="headline2">{stats.views}</Typography>
                    <Typography use="overline">Views</Typography>
                </StatBox>
                <StatBox>
                    <Typography use="headline2">{conversionRate}%</Typography>
                    <Typography use="overline">Conversion Rate</Typography>
                </StatBox>
            </ContentWrapper>
        </Block>
    );
};
