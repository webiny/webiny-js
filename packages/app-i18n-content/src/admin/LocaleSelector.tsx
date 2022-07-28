import React, { useMemo } from "react";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ButtonPrimary, ButtonIcon } from "@webiny/ui/Button";
import { css } from "emotion";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as DoneIcon } from "./assets/done-24px.svg";
import { ReactComponent as TranslateIcon } from "./assets/round-translate-24px.svg";
import { I18NSecurityPermission } from "@webiny/app-i18n/types";

const menuList = css({
    width: 160,
    right: 80,
    left: "auto !important"
});

const buttonStyles = css({
    marginRight: 10
});

export const LocaleSelector: React.FC = () => {
    const { setCurrentLocale, getCurrentLocale, getLocales } = useI18N();
    const { identity, getPermission } = useSecurity();

    const contentI18NPermission = useMemo((): I18NSecurityPermission | null => {
        return getPermission("content.i18n");
    }, [identity]);

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
            anchor={"bottomLeft"}
            className={menuList}
            handle={
                <ButtonPrimary className={buttonStyles} flat data-testid={"app-i18n-content.menu"}>
                    <ButtonIcon icon={<TranslateIcon />} />
                    Locale: {currentLocale}
                </ButtonPrimary>
            }
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
