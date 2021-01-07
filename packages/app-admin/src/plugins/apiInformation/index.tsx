import React from "react";
import Helmet from "react-helmet";
import { AdminDrawerFooterMenuPlugin } from "@webiny/app-admin/types";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { Link, Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import { ReactComponent as InfoIcon } from "../../assets/icons/info.svg";
import Playground from "./Playground";

const t = i18n.ns("app-admin/navigation");

// @ts-ignore
export default () => [
    {
        type: "admin-drawer-footer-menu",
        name: "admin-drawer-footer-menu-api-information",
        render({ hideMenu }) {
            return (
                <Link to="/api-information">
                    <ListItem ripple={false} onClick={hideMenu}>
                        <ListItemGraphic>
                            <Icon icon={<InfoIcon />} />
                        </ListItemGraphic>
                        {t`API Information`}
                    </ListItem>
                </Link>
            );
        }
    } as AdminDrawerFooterMenuPlugin,
    {
        name: "route-api-playground",
        type: "route",
        route: (
            <Route
                exact
                path={"/api-information"}
                render={() => (
                    <AdminLayout>
                        <Helmet>
                            <title>API Information</title>
                        </Helmet>
                        <Playground />
                    </AdminLayout>
                )}
            />
        )
    } as RoutePlugin
];
