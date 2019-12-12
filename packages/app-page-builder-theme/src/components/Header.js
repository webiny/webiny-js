import React, { useState, useCallback, useMemo } from "react";
import get from "lodash.get";
import { Query } from "react-apollo";
import { getPlugins } from "@webiny/plugins";
import { getHeaderData } from "./graphql";

const menuName = "main-menu";

const Header = () => {
    const [mobileMenu, showMobileMenu] = useState(false);

    const { desktopHeader: DesktopHeader, mobileHeader: MobileHeader } = useMemo(() => {
        return getPlugins("pb-layout-component-header").reduce((acc, item) => {
            acc[item.componentType] = item.component;
            return acc;
        }, {});
    }, []);

    const toggleMobileMenu = useCallback(() => {
        showMobileMenu(!mobileMenu);
    }, [mobileMenu]);

    return (
        <Query query={getHeaderData}>
            {({ data: response }) => {
                const { name, logo } = get(response, "pageBuilder.getSettings.data") || {};

                return (
                    <React.Fragment>
                        <div className={"webiny-pb-section-header"}>
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
