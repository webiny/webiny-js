import React from "react";
import { useRouteMatch, useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Box, Columns, Stack } from "~/components/Layout";
import { Avatar } from "~/views/publishingWorkflows/components/ReviewersList";
import { fromNow } from "~/components/utils";
import { ChangeRequestItem, TypographySecondary, TypographyTitle } from "../Styled";
import { RichTextEditor } from "@webiny/app-admin/components/RichTextEditor";
import { ApwChangeRequest, ApwChangeRequestStatus } from "~/types";

const statusToBackgroundColor = {
    [ApwChangeRequestStatus.RESOLVED]: "var(--mdc-theme-secondary)",
    [ApwChangeRequestStatus.ACTIVE]: "var(--mdc-theme-primary)",
    [ApwChangeRequestStatus.PENDING]: "var(--mdc-theme-on-background)"
};

const StatusBadge = styled.div<{ status: ApwChangeRequestStatus }>`
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: ${props => statusToBackgroundColor[props.status]};
`;

const getRandomIndex = () => Math.round(Math.random() * 100) % 3;

type ChangeRequestItemProps = ApwChangeRequest;

export const ChangeRequestListItem: React.FC<ChangeRequestItemProps> = props => {
    const { createdOn, createdBy, title, id, body, resolved } = props;
    const { history, location } = useRouter();
    const { url } = useRouteMatch();

    const status = resolved ? ApwChangeRequestStatus.RESOLVED : ApwChangeRequestStatus.ACTIVE;
    /**
     * Get active "changeRequestId" from pathname.
     */
    const tokens = location.pathname.split("/");
    const activeChangeRequestId = tokens[tokens.length - 1];

    return (
        <ChangeRequestItem
            onClick={() => history.push(`${url}/${encodeURIComponent(id)}`)}
            selected={encodeURIComponent(id) === activeChangeRequestId}
        >
            <Stack space={1} width={"100%"}>
                <Columns space={1} justifyContent={"space-between"}>
                    <Columns space={2.5} alignItems={"center"}>
                        <Box>
                            <Avatar index={getRandomIndex()} />
                        </Box>
                        <Box>
                            <Typography use={"subtitle1"} style={{ textTransform: "capitalize" }}>
                                {createdBy.displayName}
                            </Typography>
                        </Box>
                    </Columns>
                    <Box display={"flex"} alignItems={"center"}>
                        <TypographySecondary use={"caption"}>
                            {fromNow(createdOn)}
                        </TypographySecondary>
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
                    <RichTextEditor readOnly={true} value={body} />
                </Box>
            </Stack>
        </ChangeRequestItem>
    );
};
