import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { ReactComponent as LaunchIcon } from "~/admin/assets/icons/launch_24dp.svg";

const t = i18n.ns("app-apw/admin/content-reviews/editor");

const TypographyRevision = styled(Typography)`
    line-height: 1rem;
`;

const OpenInNewButton = styled(IconButton)`
    padding: 0;
    width: 24px;
    height: 24px;
`;

const Name = () => {
    return (
        <Stack space={1} paddingX={5}>
            <Box>
                <TypographyRevision use={"overline"}>
                    {t`Revision #{version}`({ version: 15 })}
                </TypographyRevision>
            </Box>
            <Columns space={4}>
                <Box>
                    <Typography use={"headline6"}>{t`Home page`}</Typography>
                </Box>
                <Box display={"flex"} alignItems={"center"}>
                    <OpenInNewButton icon={<LaunchIcon />} />
                </Box>
            </Columns>
        </Stack>
    );
};

export default Name;
