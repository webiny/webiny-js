import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { useWcp } from "@webiny/app-admin";
import { ListItem } from "@webiny/ui/List";
import { subFooter } from "./Styled";
import { config as appConfig } from "@webiny/app/config";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";

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

export const WebinyVersionListItem = () => {
    const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);
    const wcp = useWcp();

    const wcpBadge = useMemo(() => {
        const wcpProject = wcp.getProject();
        if (!wcpProject) {
            return null;
        }

        const tooltipContent = (
            <span>
                alphacloud/alphacloudco
            </span>
        );

        return (
            <Tooltip content={tooltipContent} placement={"topRight"}>
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
