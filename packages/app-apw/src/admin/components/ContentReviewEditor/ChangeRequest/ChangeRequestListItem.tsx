import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import { Avatar } from "~/admin/views/publishingWorkflows/components/ReviewersList";
import { ChangeRequestItem, TypographySecondary, TypographyTitle } from "../Styled";

const statusToBackgroundColor = {
    new: "var(--mdc-theme-secondary)",
    active: "var(--mdc-theme-primary)",
    inactive: "var(--mdc-theme-on-background)"
};

const StatusBadge = styled.div<{ status: string }>`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => statusToBackgroundColor[props.status]};
`;

const getRandomIndex = () => Math.round(Math.random() * 100) % 3;

interface ChangeRequestItemProps {
    createdBy: {
        displayName: string;
    };
    createdOn: string;
    title: string;
    body: string;
    status: string;
}

const ChangeRequestListItem: React.FC<ChangeRequestItemProps> = ({
    createdOn,
    createdBy,
    title,
    body,
    status
}) => {
    return (
        <ChangeRequestItem>
            <Stack space={1}>
                <Columns space={1} justifyContent={"space-between"}>
                    <Columns space={2.5} alignItems={"center"}>
                        <Box>
                            <Avatar index={getRandomIndex()} />
                        </Box>
                        <Box>
                            <Typography use={"subtitle1"}>{createdBy.displayName}</Typography>
                        </Box>
                    </Columns>
                    <Box>
                        <TypographySecondary use={"caption"}>{createdOn}</TypographySecondary>
                    </Box>
                </Columns>
                <Columns
                    space={1}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                    paddingTop={1}
                >
                    <Box>
                        <TypographyTitle use={"subtitle1"}>{title}</TypographyTitle>
                    </Box>
                    <Box>
                        <StatusBadge status={status} />
                    </Box>
                </Columns>
                <Box>
                    <TypographySecondary use={"caption"}>{body}</TypographySecondary>
                </Box>
            </Stack>
        </ChangeRequestItem>
    );
};

export default ChangeRequestListItem;
