// @flow
import React from "react";
import { ReactComponent as I18NIcon } from "./../assets/icons/round-translate-24px.svg";
import { i18n } from "@webiny/app/i18n";
import { hasRoles } from "@webiny/app-security";

const t = i18n.namespace("Pb.Categories");

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
                    <Menu label={t`Languages`} icon={<I18NIcon />}>
                        {locales && (
                            <Menu label={t`Locales`}>
                                {locales && <Menu label={t`Locales`} path="/i18n/locales" />}
                            </Menu>
                        )}
                    </Menu>
                );
            }

            return null;
        }
    }
];
