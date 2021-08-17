import React from "react";
import { PbPageData } from "@webiny/app-page-builder/types";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import { HeaderContextProvider } from "./useMobileHeader";

const menuName = "main-menu";

type HeaderProps = {
    settings: Record<string, any>;
    page: PbPageData;
};

const Header = ({ settings }: HeaderProps) => {
    const { name, logo } = settings;

    return (
        <HeaderContextProvider>
            <div className={"webiny-pb-section-header"} data-testid={"pb-desktop-mobile-headers"}>
                <DesktopHeader menuName={menuName} name={name} logo={logo} />
                <MobileHeader menuName={menuName} name={name} logo={logo} />
            </div>
            <div className={"webiny-pb-section-header-spacer"} />
        </HeaderContextProvider>
    );
};

export default Header;
