import React from "react";
import { AdminDrawerFooterMenuPlugin } from "@webiny/app-admin/types";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as DocsIcon } from "../../assets/icons/icon-documentation.svg";

const t = i18n.ns("app-admin/navigation");

const plugin: AdminDrawerFooterMenuPlugin = {
    type: "admin-drawer-footer-menu",
    name: "admin-drawer-footer-menu-documentation",
    render() {
        return (
            <a href="https://docs.webiny.com/" rel="noopener noreferrer" target="_blank">
                <ListItem ripple={false}>
                    <ListItemGraphic>
                        <Icon icon={<DocsIcon />} />
                    </ListItemGraphic>
                    {t`Documentation`}
                </ListItem>
            </a>
        );
    }
};

export default plugin;
