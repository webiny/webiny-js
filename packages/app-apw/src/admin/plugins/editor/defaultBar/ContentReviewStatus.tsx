import React from "react";
import upperCase from "lodash/upperCase";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Circle, StatusText } from "~/admin/views/contentReviewDashboard/components/Styled";
import { statusToLevel } from "~/admin/views/contentReviewDashboard/components/ContentReviewStatus";
import { ApwContentReviewStatus } from "~/types";

function ContentReviewStatus() {
    const status = ApwContentReviewStatus.UNDER_REVIEW;
    const level = statusToLevel[status];
    return (
        <Stack space={2} paddingX={4}>
            <Columns space={4}>
                <Circle active={level >= 0} />
                <Circle active={level >= 1} />
                <Circle active={level >= 2} />
            </Columns>
            <Box display={"flex"} justifyContent={"center"}>
                <StatusText>{upperCase(status)}</StatusText>
            </Box>
        </Stack>
    );
}

export default ContentReviewStatus;
