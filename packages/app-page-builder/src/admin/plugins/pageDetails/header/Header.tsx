import React from "react";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { Typography } from "@webiny/ui/Typography";
import { PbPageData } from "~/types";

const HeaderTitle = styled("div")({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid var(--mdc-theme-on-background)",
    color: "var(--mdc-theme-text-primary-on-background)",
    background: "var(--mdc-theme-surface)",
    paddingTop: 10,
    paddingBottom: 9,
    paddingLeft: 24,
    paddingRight: 24
});

const PageTitle = styled("div")({
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
});

const HeaderActions = styled("div")({
    justifyContent: "flex-end",
    marginRight: "-15px",
    marginLeft: "10px",
    display: "flex",
    alignItems: "center"
});

interface HeaderProps {
    page: PbPageData;
}
const Header: React.FC<HeaderProps> = props => {
    const { page } = props;
    return (
        <React.Fragment>
            <HeaderTitle>
                <PageTitle>
                    <Typography use="headline5">{page.title}</Typography>
                </PageTitle>
                <HeaderActions>
                    {renderPlugins("pb-page-details-header-left", props)}
                    {renderPlugins("pb-page-details-header-right", props)}
                </HeaderActions>
            </HeaderTitle>
        </React.Fragment>
    );
};

export default Header;
