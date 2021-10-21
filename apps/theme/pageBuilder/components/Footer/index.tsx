import * as React from "react";
import { Link } from "@webiny/react-router";
import { PbPageData } from "@webiny/app-page-builder/types";
import FooterMenu, { CustomLink, FooterMenuProps } from "./FooterMenu";
import Menu, { hasMenuItems } from "../Menu";
import Newsletter from "./Neswletter";
import * as Styled from "./styled";

const FooterSocialMenu: React.FunctionComponent<FooterMenuProps> = ({ data }) => {
    /**
     * Bail out early if there are no menu items.
     */
    if (!hasMenuItems(data)) {
        return null;
    }

    const socialMenuData = data.items.find(item => item.title === "Social");
    return (
        <Styled.Links>
            {socialMenuData &&
                socialMenuData.children.map(({ id, url, title }) => (
                    <CustomLink key={id} url={url} title={title} />
                ))}
        </Styled.Links>
    );
};

export type FooterProps = {
    settings: Record<string, any>;
    page: PbPageData;
};

const Footer = ({ settings }: FooterProps) => {
    const { name, logo } = settings;
    return (
        <div className={"webiny-pb-section-footer"} data-testid={"pb-footer"}>
            <Menu slug={"/footer"} component={FooterMenu} />
            <Styled.FooterContainer>
                <Styled.FooterGrid>
                    <Styled.LeftPanel>
                        <Styled.Logo>
                            <Link to="/">
                                {logo && logo.src && <img src={logo.src} alt={name} />}
                            </Link>
                        </Styled.Logo>
                        <Styled.WebsiteDescription className={"webiny-pb-typography-description"}>
                            Webiny free to use and released under the MIT open source license.
                        </Styled.WebsiteDescription>
                        <Menu slug={"footer-main"} component={FooterSocialMenu} />
                        <Styled.WebsiteCopyRight className={"webiny-pb-typography-description"}>
                            {name} © {new Date().getFullYear()}
                        </Styled.WebsiteCopyRight>
                    </Styled.LeftPanel>
                    <Styled.RightPanel>
                        <Newsletter />
                    </Styled.RightPanel>
                </Styled.FooterGrid>
            </Styled.FooterContainer>
        </div>
    );
};

export default Footer;
