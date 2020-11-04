import React, { useState, useCallback } from "react";
import { css } from "emotion";
import { AdminDrawerFooterMenuPlugin } from "@webiny/app-admin/types";
import { ListItem, ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import ApiInformationDialog from "./ApiInformationDialog";
import { ReactComponent as InfoIcon } from "../../assets/icons/info.svg";

const t = i18n.ns("app-admin/navigation");

const style = {
    environmentContainer: css({
        color: "var(--mdc-theme-text-secondary-on-background)"
    }),
    infoContainer: css({
        alignSelf: "center"
    })
};

const ApiInformation = () => {
    const [infoOpened, setInfoOpened] = useState(false);

    const onClose = useCallback(() => setInfoOpened(false), []);

    return (
        <div className={style.infoContainer}>
            <ApiInformationDialog open={infoOpened} onClose={onClose} />
            <ListItem
                ripple={false}
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInfoOpened(true);
                }}
            >
                <ListItemGraphic>
                    <Icon icon={<InfoIcon />} />
                </ListItemGraphic>
                {t`API information`}
            </ListItem>
        </div>
    );
};

const plugin: AdminDrawerFooterMenuPlugin = {
    type: "admin-drawer-footer-menu",
    name: "admin-drawer-footer-menu-api-information",
    render() {
        return <ApiInformation />;
    }
};

export default plugin;
