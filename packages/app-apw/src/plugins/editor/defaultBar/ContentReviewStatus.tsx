import React from "react";
import upperCase from "lodash/upperCase";
import { Box, Columns, Stack } from "~/components/Layout";
import { Circle, StatusText } from "~/views/contentReviewDashboard/components/Styled";
import { statusToLevel } from "~/views/contentReviewDashboard/components/ContentReviewStatus";
import { useCurrentContentReview } from "~/hooks/useContentReview";

export const ContentReviewStatus = () => {
    const { contentReview } = useCurrentContentReview();
    const { status } = contentReview;
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
};
