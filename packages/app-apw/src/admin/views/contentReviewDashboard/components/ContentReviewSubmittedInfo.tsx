import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Box, Columns } from "~/admin/components/Layout";
import { Typography } from "@webiny/ui/Typography";
import { TypographySecondary } from "./Styled";

const t = i18n.ns("app-apw/admin/content-reviews/datalist");

export interface ContentReviewByProps {
    submittedBy: string;
    submittedOn: string;
}

export const ContentReviewBy: React.FC<ContentReviewByProps> = ({ submittedBy, submittedOn }) => {
    return (
        <Columns space={2.5}>
            <Box>
                <Typography use={"caption"}>{t`Submitted by:`}</Typography>
            </Box>
            <Box>
                <TypographySecondary use={"caption"}>
                    {t`{submittedBy} on {submittedOn}`({ submittedBy, submittedOn })}
                </TypographySecondary>
            </Box>
        </Columns>
    );
};
