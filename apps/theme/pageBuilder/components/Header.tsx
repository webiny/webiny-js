import React, { useState, useCallback } from "react";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import { PbPageData } from "@webiny/app-page-builder/types";
import styled from "@emotion/styled";

import { colors, typography } from "../theme";

const StyledHeader = styled.header`
    background-color: #fff;
    box-shadow: 0 0 1px 1px rgb(34 45 57 / 15%);
    height: 40px;
    padding: 10px 0 5px;
    width: 100%;
    z-index: 100;

    position: sticky;
    top: 0;

    a {
        ${typography.paragraph1}
        color: ${colors.color1};
        text-decoration: none;
    }
`;

const MENU_NAME = "main-menu";

interface HeaderProps {
    settings: Record<string, any>;
    page: PbPageData;
}

const Header: React.FC<HeaderProps> = ({ settings }) => {
    const { name, logo } = settings;

    const [mobileMenu, showMobileMenu] = useState(false);

    const toggleMobileMenu = useCallback(() => {
        showMobileMenu(!mobileMenu);
    }, [mobileMenu]);

    return (
        <StyledHeader data-testid={"pb-desktop-mobile-headers"}>
            <DesktopHeader menuName={MENU_NAME} name={name} logo={logo} />
            <MobileHeader
                menuName={MENU_NAME}
                name={name}
                logo={logo}
                active={mobileMenu}
                toggleMenu={toggleMobileMenu}
            />
        </StyledHeader>
    );
};

export default Header;
