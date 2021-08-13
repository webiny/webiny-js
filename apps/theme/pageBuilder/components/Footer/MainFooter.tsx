import React from "react";
import styled from "@emotion/styled";
import { Link } from "@webiny/react-router";
import Newsletter from "./Neswletter";
import { FooterProps } from "./index";
import { CustomLink, FooterMenuProps } from "./FooterMenu";
import Menu from "../Menu";

const FooterContainer = styled.div`
    box-sizing: border-box;
    width: 100%;
    color: var(--webiny-theme-color-background);
    border-top: 1px solid #3b3e45;

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        border: none;
    }
`;

const FooterGrid = styled.div`
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 25px;
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        flex-direction: column;
    }
`;

const LeftPanel = styled.div`
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        padding: 20px;
        text-align: center;
    }
`;

const RightPanel = styled.div`
    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        padding: 20px;
    }
`;

const Logo = styled.div`
    display: flex;
    margin-bottom: 25px;

    & img {
        max-width: 150px;
    }

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        justify-content: center;
    }
`;

const WebsiteDescription = styled.p`
    margin-bottom: 12px;
    color: var(--webiny-theme-color-background);
`;

const Links = styled.div`
    display: flex;
    margin-bottom: 12px;

    & a {
        color: var(--webiny-theme-color-background) !important;
        font-size: 14px;
        margin-right: 4px;

        &::after {
            content: "/";
            margin-left: 4px;
        }
    }

    // Let's write some responsive code using media classes
    .webiny-pb-media-query--mobile-landscape &,
    .webiny-pb-media-query--mobile-portrait & {
        justify-content: center;
    }
`;

const WebsiteCopyRight = styled.p`
    color: var(--webiny-theme-color-background);
    margin-bottom: 12px;
`;

const FooterSocialMenu: React.FunctionComponent<FooterMenuProps> = ({ data }) => {
    const socialMenuData = data.items.find(item => item.title === "Social");
    return (
        <Links>
            {socialMenuData &&
                socialMenuData.children.map(({ id, url, title }) => (
                    <CustomLink key={id} url={url} title={title} />
                ))}
        </Links>
    );
};

const MainFooter = ({ settings }: FooterProps) => {
    const { name, logo } = settings;
    return (
        <FooterContainer>
            <FooterGrid>
                <LeftPanel>
                    <Logo>
                        <Link to="/">{logo && logo.src && <img src={logo.src} alt={name} />}</Link>
                    </Logo>
                    <WebsiteDescription className={"webiny-pb-typography-description"}>
                        Webiny free to use and released under the MIT open source license.
                    </WebsiteDescription>
                    <Menu slug={"footer-main"} component={FooterSocialMenu} />
                    <WebsiteCopyRight className={"webiny-pb-typography-description"}>
                        {name} © {new Date().getFullYear()}
                    </WebsiteCopyRight>
                </LeftPanel>
                <RightPanel>
                    <Newsletter />
                </RightPanel>
            </FooterGrid>
        </FooterContainer>
    );
};

export default MainFooter;
