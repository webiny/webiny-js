import React from "react";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as OpenInNew } from "@material-design-icons/svg/round/open_in_new.svg";
import { PbPageData } from "~/types";
import { usePreviewPage } from "~/admin/hooks/usePreviewPage";

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
    cursor: pointer;

    span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 300px;
    }

    svg {
        display: none;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        margin-left: 2px;
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
const Header = (props: HeaderProps) => {
    const { page } = props;
    const { previewPage, previewUrl } = usePreviewPage({
        id: page.id,
        status: page.status,
        path: page.path
    });

    return (
        <React.Fragment>
            <HeaderTitle>
                <PageInfo>
                    <PageTitle>
                        <Typography use="headline6">{page.title}</Typography>
                    </PageTitle>
                    <PageLink onClick={previewPage}>
                        <Typography use="caption">{previewUrl}</Typography>
                        <OpenInNew />
                    </PageLink>
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
