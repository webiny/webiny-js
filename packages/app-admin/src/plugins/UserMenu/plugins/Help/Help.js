//@flow
import React from "react";
import { ListItem, ListItemGraphic, ListItemMeta } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { css } from "emotion";
import { ReactComponent as HelpIcon } from "@webiny/app-admin/assets/icons/round-help-24px.svg";
import { ReactComponent as OpenInNewIcon } from "@webiny/app-admin/assets/icons/round-open_in_new-24px.svg";

const smallerIcon = css({
    "> svg": {
        transform: "scale(0.8)"
    }
});

const Help = () => {
    return (
        <ListItem
            onClick={() => {
                window.open("https://www.webiny.com/support/", "_blank");
            }}
        >
            <ListItemGraphic>
                <Icon icon={<HelpIcon />} />
            </ListItemGraphic>
            Help
            <ListItemMeta className={smallerIcon}>
                <Icon icon={<OpenInNewIcon />} />
            </ListItemMeta>
        </ListItem>
    );
};

export default Help;
