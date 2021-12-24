import React, { useMemo } from "react";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as DoneIcon } from "./assets/done-24px.svg";
import { ReactComponent as TranslateIcon } from "./assets/round-translate-24px.svg";

const menuList = css({
    width: 160,
    right: 80,
    left: "auto !important"
});

const buttonStyles = css({
    marginRight: 10
});

export const LocaleSelector = () => {
    const { setCurrentLocale, getCurrentLocale, getLocales } = useI18N();
    const { identity } = useSecurity();

    const contentI18NPermission = useMemo(() => identity.getPermission("content.i18n"), []);

    const locales = getLocales();
    const localeList = locales.filter(locale => {
        if (!contentI18NPermission || !Array.isArray(contentI18NPermission.locales)) {
            return true;
        }
        return contentI18NPermission.locales.includes(locale.code);
    });

    if (localeList.length === 1) {
        return null;
    }

    const currentLocale = getCurrentLocale("content");
    return (
        <Menu
            anchor={"topEnd"}
            className={menuList}
            handle={
                <ButtonPrimary className={buttonStyles} flat>
                    <ButtonIcon icon={<TranslateIcon />} />
                    Locale: {currentLocale}
                </ButtonPrimary>
            }
            data-testid={"app-i18n-content.menu"}
        >
            {localeList.map(locale => (
                <MenuItem
                    key={locale.code}
                    onClick={() => {
                        setCurrentLocale(locale.code, "content");
                        window.location.reload();
                    }}
                    data-testid={`app-i18n-content.menu-item.${locale.code}`}
                >
                    <span style={{ minWidth: 35 }}>
                        {currentLocale === locale.code && (
                            <ButtonIcon
                                icon={<DoneIcon style={{ color: "var(--mdc-theme-primary)" }} />}
                            />
                        )}
                    </span>

                    {locale.code}
                </MenuItem>
            ))}
        </Menu>
    );
};
