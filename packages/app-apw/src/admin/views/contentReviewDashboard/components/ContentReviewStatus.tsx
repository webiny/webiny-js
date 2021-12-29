import React from "react";
import upperCase from "lodash/upperCase";
import { ApwContentReviewStatus } from "~/types";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import {
    Circle,
    CommentCountBox,
    CommentsCount,
    OverlappingAvatar,
    statusBoxStyle,
    StatusText
} from "./Styled";

export const statusToLevel = {
    [ApwContentReviewStatus.UNDER_REVIEW]: 0,
    [ApwContentReviewStatus.READY_TO_BE_PUBLISHED]: 1,
    [ApwContentReviewStatus.PUBLISHED]: 2
};

const CommentBadge: React.FC<{ comments: number }> = ({ comments, ...props }) => {
    return (
        <CommentCountBox {...props} width={"fit-content"}>
            <CommentsCount>{comments}</CommentsCount>
        </CommentCountBox>
    );
};

export interface ContentReviewStatusProps {
    status: ApwContentReviewStatus;
    comments: number;
    reviewers: Record<string, any>[];
    width: string;
}

export const ContentReviewStatus: React.FC<ContentReviewStatusProps> = ({
    status,
    comments,
    reviewers,
    ...boxProps
}) => {
    const level = statusToLevel[status];
    return (
        <Stack {...boxProps} space={2} className={statusBoxStyle} padding={4} paddingBottom={3}>
            <Columns space={4}>
                <Circle active={level >= 0} />
                <Circle active={level >= 1} />
                <Circle active={level >= 2} />
            </Columns>
            <Box display={"flex"}>
                <StatusText>{upperCase(status)}</StatusText>
            </Box>
            <Columns space={2.5} alignItems={"center"}>
                <Columns space={1.5}>
                    {reviewers.map((_, index) => (
                        <OverlappingAvatar key={index} useNegativeMargin={true} />
                    ))}
                </Columns>
                <CommentBadge comments={comments} />
            </Columns>
        </Stack>
    );
};
