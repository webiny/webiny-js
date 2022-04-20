import React from "react";
import { listItemStyles, StatusBox, TypographyBold } from "./Styled";
import { Box, Columns, Stack } from "~/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";

import { ContentReviewBy } from "./ContentReviewSubmittedInfo";
import { ContentReviewStatus } from "./ContentReviewStatus";
import { LatestComment } from "./LatestComment";
import { ApwContentReviewListItem } from "~/types";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

type ContentReviewItemProps = Pick<
    ApwContentReviewListItem,
    | "content"
    | "latestCommentId"
    | "title"
    | "activeStep"
    | "reviewers"
    | "status"
    | "totalComments"
    | "createdOn"
    | "createdBy"
>;

const STATUS_BOX_WIDTH = "126px";

export const ContentReviewListItem: React.FC<ContentReviewItemProps> = props => {
    const {
        activeStep,
        title,
        reviewers,
        status,
        latestCommentId,
        content,
        createdOn,
        createdBy,
        totalComments
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
                            <TypographyBold use={"subtitle1"}>{title}</TypographyBold>
                        </Box>
                        <Box display={"flex"} justifyContent={"flex-end"}>
                            <Typography use={"caption"}>
                                {t`rev #{version}`({ version: content.version })}
                            </Typography>
                        </Box>
                    </Columns>
                    <Stack space={2}>
                        <ContentReviewBy
                            submittedOn={createdOn}
                            submittedBy={createdBy.displayName}
                        />
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
                comments={totalComments}
                reviewers={reviewers}
                content={content}
            />
        </Columns>
    );
};
