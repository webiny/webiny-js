import React from "react";
import { AdminHeaderRightPlugin } from "@webiny/app-admin/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { css } from "emotion";
import { ReactComponent as DoneIcon } from "./../../assets/icons/done-24px.svg";
import { ReactComponent as TranslateIcon } from "./../../assets/icons/round-translate-24px.svg";

const menuDialog = css({
    "&.mdc-menu": {
        minWidth: 125
    }
});

const buttonStyles = css({
    marginRight: 10
});

const plugin: AdminHeaderRightPlugin = {
    type: "admin-header-right",
    render() {
        const { getLocale, getLocales } = useI18N();

        return (
            <Menu
                className={menuDialog}
                handle={
                    <ButtonPrimary className={buttonStyles} flat>
                        <ButtonIcon icon={<TranslateIcon />} />
                        Locale: {getLocale().code}
                    </ButtonPrimary>
                }
            >
                {getLocales().map(locale => (
                    <MenuItem
                        key={locale.code}
                        onClick={() => {
                            console.log("Apple selected!");
                        }}
                    >
                        {locale.code}
                        {getLocale().code === locale.code && <ButtonIcon icon={<DoneIcon />} />}
                    </MenuItem>
                ))}
            </Menu>
        );
    }
};

export default plugin;
