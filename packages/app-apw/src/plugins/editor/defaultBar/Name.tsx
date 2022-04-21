import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Box, Columns, Stack } from "~/components/Layout";
import { ReactComponent as LaunchIcon } from "~/assets/icons/launch_24dp.svg";
import { useCurrentContentReview } from "~/hooks/useContentReview";
import { ApwContentReviewContent, ApwContentTypes } from "~/types";

const t = i18n.ns("app-apw/admin/content-reviews/editor");

const TypographyRevision = styled(Typography)`
    line-height: 1rem;
`;

const OpenInNewButton = styled(IconButton)`
    padding: 0;
    width: 24px;
    height: 24px;
`;

const getContentUrl = (content: ApwContentReviewContent): string => {
    if (content.type === ApwContentTypes.PAGE) {
        return `/page-builder/pages?id=${encodeURIComponent(content.id)}`;
    }
    if (content.type === ApwContentTypes.CMS_ENTRY) {
        return `cms/content-entries/${content.settings.modelId}?id=${encodeURIComponent(
            content.id
        )}`;
    }
    return ``;
};

export const Name = () => {
    const { contentReview } = useCurrentContentReview();
    const url = getContentUrl(contentReview.content);

    return (
        <Stack space={1} paddingX={5}>
            <Box>
                <TypographyRevision use={"overline"}>
                    {t`Revision #{version}`({ version: contentReview.content.version })}
                </TypographyRevision>
            </Box>
            <Columns space={4}>
                <Box>
                    <Typography use={"headline6"}>{contentReview.title}</Typography>
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                    <OpenInNewButton
                        icon={<LaunchIcon />}
                        onClick={() => window.open(url, "_blank", "noopener")}
                    />
                </Box>
            </Columns>
        </Stack>
    );
};
