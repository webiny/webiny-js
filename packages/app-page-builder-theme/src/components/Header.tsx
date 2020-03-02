import React, { useState, useCallback } from "react";
import get from "lodash.get";
import { Query } from "react-apollo";
import { getHeaderData } from "./graphql";
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";

const menuName = "main-menu";

const Header = () => {
    const [mobileMenu, showMobileMenu] = useState(false);

    const toggleMobileMenu = useCallback(() => {
        showMobileMenu(!mobileMenu);
    }, [mobileMenu]);

    return (
        <Query query={getHeaderData}>
            {({ data: response }) => {
                const { name, logo } = get(response, "pageBuilder.getSettings.data") || {};

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
            }}
        </Query>
    );
};

export default Header;
