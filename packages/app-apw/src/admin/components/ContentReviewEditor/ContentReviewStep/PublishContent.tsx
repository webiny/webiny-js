import styled from "@emotion/styled";
import React from "react";
import { Box } from "~/admin/components/Layout";
import { ButtonIcon, ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { ReactComponent as CheckIcon } from "~/admin/assets/icons/check_24dp.svg";
import { ApwContentReviewStatus } from "~/types";

import { i18n } from "@webiny/app/i18n";
import { Tooltip } from "@webiny/ui/Tooltip";
import { usePublishContent } from "~/admin/hooks/usePublishContent";
import { CircularProgress } from "@webiny/ui/Progress";

const t = i18n.ns("app-apw/content-reviews/editor/steps/publishContent");

const PublishContentBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;

interface PublishContentProps {
    status: ApwContentReviewStatus;
}

const defaultButtonStyles = { width: "217px" };
const activeButtonStyles = { backgroundColor: "var(--mdc-theme-secondary)" };

export const PublishContent: React.FC<PublishContentProps> = ({ status }) => {
    const { loading, publishContent, unpublishContent } = usePublishContent();
    const disabledButtonTooltip = t`Content can only be published once all sign offs have been provided.`;
    const alreadyPublishedMessage = t`Content has been already published.`;

    if (loading) {
        return <CircularProgress label={"Loading"} />;
    }

    if (status === ApwContentReviewStatus.UNDER_REVIEW) {
        return (
            <PublishContentBox paddingX={5}>
                <Tooltip
                    content={
                        status === ApwContentReviewStatus.UNDER_REVIEW
                            ? disabledButtonTooltip
                            : alreadyPublishedMessage
                    }
                >
                    <ButtonPrimary style={defaultButtonStyles} disabled={true}>
                        <ButtonIcon icon={<CheckIcon />} />
                        {t` Publish Content`}
                    </ButtonPrimary>
                </Tooltip>
            </PublishContentBox>
        );
    }

    if (status === ApwContentReviewStatus.PUBLISHED) {
        return (
            <PublishContentBox paddingX={5}>
                <ButtonDefault
                    style={defaultButtonStyles}
                    onClick={() => {
                        unpublishContent();
                    }}
                >
                    <ButtonIcon icon={<CheckIcon />} />
                    {t`Un-Publish Content`}
                </ButtonDefault>
            </PublishContentBox>
        );
    }

    return (
        <PublishContentBox paddingX={5}>
            <ButtonPrimary
                style={{ ...defaultButtonStyles, ...activeButtonStyles }}
                onClick={() => {
                    publishContent();
                }}
            >
                <ButtonIcon icon={<CheckIcon />} />
                {t` Publish Content`}
            </ButtonPrimary>
        </PublishContentBox>
    );
};
