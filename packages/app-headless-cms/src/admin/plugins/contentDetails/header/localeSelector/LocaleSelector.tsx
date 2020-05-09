import React from "react";
import { css } from "emotion";
import { withRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownButton } from "@webiny/app-headless-cms/admin/icons/round-arrow_drop_down-24px.svg";
import { ReactComponent as DoneIcon } from "@webiny/app-headless-cms/admin/icons/done-24px.svg";
import { MenuItem } from "@rmwc/menu";
import { Menu } from "@webiny/ui/Menu";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { i18n } from "@webiny/app/i18n";
import { ListItemGraphic } from "@webiny/ui/List";
const t = i18n.ns("app-headless-cms/admin");

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuStyles = css({
    width: 175,
    right: 0,
    ".mdc-list-item__graphic": {
        marginRight: 10
    }
});

const LocaleSelector = ({ getLocale, setLocale, getLoading }) => {
    const i18n = useI18N();

    return (
        <Menu
            className={menuStyles}
            handle={
                <ButtonDefault className={buttonStyle} disabled={getLoading()}>
                    {t`Locale: {locale}`({
                        locale: i18n.getLocales().find(item => item.id === getLocale()).code
                    })}
                    <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {i18n.getLocales().map(item => (
                <MenuItem key={item.id} onClick={() => setLocale(item.id)}>
                    <ListItemGraphic>
                        {item.id === getLocale() && <Icon icon={<DoneIcon />} />}
                    </ListItemGraphic>
                    {item.code}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default withRouter(LocaleSelector);
