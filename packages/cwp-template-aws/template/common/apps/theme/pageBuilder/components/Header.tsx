import React, { useState, useCallback } from "react";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import { PbPageData } from "@webiny/app-page-builder/types";

const menuName = "main-menu";

interface HeaderProps {
    settings: Record<string, any>;
    page: PbPageData;
}

const Header: React.FC<HeaderProps> = ({ settings }) => {
    const { name, logo } = settings;

    const [mobileMenu, showMobileMenu] = useState<boolean>(false);

    const toggleMobileMenu = useCallback(() => {
        showMobileMenu(!mobileMenu);
    }, [mobileMenu]);

    return (
        <React.Fragment>
            <div className={"webiny-pb-section-header"} data-testid={"pb-desktop-mobile-headers"}>
                <DesktopHeader menuName={menuName} name={name} logo={logo} />
                <MobileHeader
                    menuName={menuName}
                    name={name}
                    logo={logo}
                    active={mobileMenu}
                    toggleMenu={toggleMobileMenu}
                />
            </div>
            <div className={"webiny-pb-section-header-spacer"} />
        </React.Fragment>
    );
};

export default Header;
