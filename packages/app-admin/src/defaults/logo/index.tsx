import React from "react";
import { AdminViewPlugin } from "~/plugins/AdminViewPlugin";
import Logo from "~/defaults/logo/Logo";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { plugins } from "@webiny/plugins";
import { AdminMenuLogoPlugin } from "~/types";
import { logoStyle } from "~/views/NavigationView/Styled";

export default () => [
    /* Set logo in the layout header. */
    new AdminViewPlugin(view => {
        view.getHeaderElement().setLogo(<Logo white />);
    }),
    /* Set logo in the navigation drawer. */
    new NavigationViewPlugin(view => {
        view.getHeaderElement().setLogo(
            <Logo onClick={() => view.getNavigationHook().hideMenu()} />
        );

        // Fetch logo plugin for backwards compatibility.
        const logoPlugin = plugins.byName<AdminMenuLogoPlugin>("admin-menu-logo");
        if (logoPlugin) {
            view.getHeaderElement().setLogo(
                React.cloneElement(logoPlugin.render(), { className: logoStyle })
            );
        }
    })
];
