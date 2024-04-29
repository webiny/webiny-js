import React, { useMemo } from "react";
import { css } from "emotion";
import styled from "@emotion/styled";
import { ListItem } from "@webiny/ui/List";
import { config as appConfig } from "@webiny/app/config";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useWcp } from "~/index";

export const subFooter = css`
    .mdc-drawer &.mdc-list-item {
        border-top: 1px solid var(--mdc-theme-on-background);
        padding: 10px 16px;
        margin: 10px 0 0;
    }
`;

const WcpBadge = styled.div`
    background-color: var(--mdc-theme-primary, #6200ee);
    display: inline-block;
    color: white;
    padding: 2px 4px;
    border-radius: 5px;
    font-size: 12px;
    font-weight: bold;
    line-height: 14px;
    margin-left: 5px;
`;

export const Version = () => {
    const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);
    const wcp = useWcp();

    const wcpBadge = useMemo(() => {
        const wcpProject = wcp.getProject();
        if (!wcpProject) {
            return null;
        }

        const tooltipContent = (
            <span>
                {wcpProject.orgId}/{wcpProject.projectId}
            </span>
        );

        return (
            <Tooltip content={tooltipContent}>
                <WcpBadge>WCP</WcpBadge>
            </Tooltip>
        );
    }, []);

    return (
        <ListItem ripple={false} className={subFooter}>
            <Typography use={"body2"}>
                Webiny v{wbyVersion}
                {wcpBadge}
            </Typography>
        </ListItem>
    );
};
