import React from "react";
import { css } from "emotion";
import { withRouter } from "@webiny/react-router";
import { ButtonDefault } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownButton } from "@webiny/app-headless-cms/admin/icons/round-arrow_drop_down-24px.svg";
import { MenuItem } from "@rmwc/menu";
import { Menu } from "@webiny/ui/Menu";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin");

const buttonStyle = css({
    "&.mdc-button": {
        color: "var(--mdc-theme-text-primary-on-background) !important"
    }
});

const menuList = css({
    ".mdc-list-item": {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "baseline",
        textAlign: "left"
    }
});

const LocaleSelector = ({ location, history, content }) => {
    const query = new URLSearchParams(location.search);
    const i18n = useI18N();

    return (
        <Menu
            className={menuList}
            onSelect={evt => {
                query.set("id", content.revisions[evt.detail.index].id);
                history.push({ search: query.toString() });
            }}
            handle={
                <ButtonDefault className={buttonStyle}>
                    {t`Locale: {locale}`({
                        locale: i18n.getLocale().code
                    })}
                    <Icon icon={<DownButton />} />
                </ButtonDefault>
            }
        >
            {i18n.getLocales().map(item => (
                <MenuItem key={item.id} onClick={}>
                    {item.code}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default withRouter(LocaleSelector);
