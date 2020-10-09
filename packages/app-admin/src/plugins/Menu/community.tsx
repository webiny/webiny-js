import React from "react";
import { AdminMenuCommunityPlugin } from "@webiny/app-admin/types";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/navigation");

const plugin: AdminMenuCommunityPlugin = {
    type: "admin-menu-community",
    name: "admin-menu-community",
    render() {
        return (
            <>
                <a
                    href="https://community.webiny.com/"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <ListItem ripple={false}>
                        <ListItemGraphic>
                            <Icon icon={<CommunityIcon />} />
                        </ListItemGraphic>
                        {t`Community`}
                    </ListItem>
                </a>
            </>
        );
    }
};

export default plugin;
