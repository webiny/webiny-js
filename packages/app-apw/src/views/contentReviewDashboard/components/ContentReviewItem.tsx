import React from "react";
import { listItemStyles, StatusBox, TypographyBold } from "./Styled";
import { Box, Columns, Stack } from "~/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";

import { ContentReviewBy, ContentReviewByProps } from "./ContentReviewSubmittedInfo";
import { ContentReviewStatus, ContentReviewStatusProps } from "./ContentReviewStatus";
import { LatestComment } from "./LatestComment";
import { ApwContentReviewStep } from "~/types";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

interface ContentReviewItemProps extends ContentReviewByProps, ContentReviewStatusProps {
    activeStep: ApwContentReviewStep;
    contentTitle: string;
    contentRevisionNumber: number;
    latestCommentId: string;
}

const STATUS_BOX_WIDTH = "126px";

export const ContentReviewListItem: React.FC<ContentReviewItemProps> = props => {
    const {
        activeStep,
        contentTitle,
        contentRevisionNumber,
        submittedOn,
        submittedBy,
        comments,
        reviewers,
        status,
        latestCommentId
    } = props;

    return (
        <Columns space={0} className={listItemStyles}>
            <Box
                width={`calc(100% - ${STATUS_BOX_WIDTH})`}
                paddingLeft={5}
                paddingRight={4}
                paddingTop={3}
                paddingBottom={3}
            >
                <Stack space={3}>
                    <Columns space={1} justifyContent={"space-between"} alignItems={"center"}>
                        <Box>
                            <TypographyBold use={"subtitle1"}>{contentTitle}</TypographyBold>
                        </Box>
                        <Box display={"flex"} justifyContent={"flex-end"}>
                            <Typography use={"caption"}>
                                {t`rev #{version}`({ version: contentRevisionNumber })}
                            </Typography>
                        </Box>
                    </Columns>
                    <Stack space={2}>
                        <ContentReviewBy submittedOn={submittedOn} submittedBy={submittedBy} />
                        <StatusBox display={"flex"} paddingX={2.5} width={"fit-content"}>
                            <Typography use={"caption"}>
                                {activeStep && activeStep.title}
                            </Typography>
                        </StatusBox>
                    </Stack>
                    {latestCommentId ? <LatestComment id={latestCommentId} /> : null}
                </Stack>
            </Box>
            <ContentReviewStatus
                width={STATUS_BOX_WIDTH}
                status={status}
                comments={comments}
                reviewers={reviewers}
            />
        </Columns>
    );
};
