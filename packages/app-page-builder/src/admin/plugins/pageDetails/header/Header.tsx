import React from "react";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { Typography } from "@webiny/ui/Typography";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { ReactComponent as LinkIcon } from "@material-design-icons/svg/round/link.svg";
import { PbPageData } from "~/types";

const HeaderTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--mdc-theme-on-background);
    color: var(--mdc-theme-text-primary-on-background);
    background: var(--mdc-theme-surface);
    padding-top: 10px;
    padding-bottom: 9px;
    padding-left: 24px;
    padding-right: 24px;
`;

const PageInfo = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const PageTitle = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    span {
        font-weight: bold;
    }
`;

const PageLink = styled.div`
    display: flex;
    align-items: center;
    height: 24px;

    span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
    }

    svg {
        display: none;
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-left: 8px;
        cursor: pointer;
    }

    :hover svg {
        display: block;
    }
`;

const HeaderActions = styled.div`
    justify-content: flex-end;
    margin-right: -15px;
    margin-left: 10px;
    display: flex;
    align-items: center;
`;

interface HeaderProps {
    page: PbPageData;
}
const Header: React.FC<HeaderProps> = props => {
    const { page } = props;
    const { getPageUrl, getWebsiteUrl } = usePageBuilderSettings();
    const [isSiteRunning] = useSiteStatus(getWebsiteUrl());

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";
    const url = getPageUrl(page);

    return (
        <React.Fragment>
            <HeaderTitle>
                <PageInfo>
                    <PageTitle>
                        <Typography use="headline6">{page.title}</Typography>
                    </PageTitle>
                    {isSiteRunning && (
                        <PageLink>
                            <Typography use="caption">{url}</Typography>
                            <LinkIcon onClick={() => window.open(url, target, "noopener")} />
                        </PageLink>
                    )}
                </PageInfo>
                <HeaderActions>
                    {renderPlugins("pb-page-details-header-left", props)}
                    {renderPlugins("pb-page-details-header-right", props)}
                </HeaderActions>
            </HeaderTitle>
        </React.Fragment>
    );
};

export default Header;
