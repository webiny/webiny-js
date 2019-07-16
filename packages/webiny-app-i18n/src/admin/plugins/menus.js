// @flow
import React from "react";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";
import { i18n } from "webiny-app/i18n";
import { hasRoles } from "webiny-app-security";

const t = i18n.namespace("Cms.Categories");

export default [
    {
        name: "i18n-menu",
        type: "menu",
        render({ Menu }: Object) {
            const { locales }: Object = (hasRoles({
                locales: ["i18n-locales"]
            }): any);

            if (locales) {
                return (
                    <Menu label={t`I18N`} icon={<I18NIcon />}>
                        {locales && (
                            <Menu label={t`Languages`}>
                                {locales && <Menu label={t`Languages`} path="/i18n/languages" />}
                            </Menu>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
