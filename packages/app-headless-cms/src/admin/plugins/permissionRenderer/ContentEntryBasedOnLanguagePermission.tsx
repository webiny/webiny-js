import React, { useEffect, useState, Fragment } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { PermissionSelector } from "./PermissionSelector";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentEntryLocales = "cms.contentEntries.locales";

const localesPermissionOptions = [
    {
        id: 0,
        value: cmsContentEntryLocales,
        label: "All Languages"
    },
    {
        id: 1,
        value: cmsContentEntryLocales + "#custom",
        label: "Only specific languages"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const ContentEntryPermissionBasedOnLanguage = ({ value, setValue }) => {
    const [permission, setPermission] = useState(cmsContentEntryLocales);
    const [showCustomPermission, setShowCustomPermission] = useState(false);

    useEffect(() => {
        const isCustom = permission.includes("custom");
        setShowCustomPermission(isCustom);

        !isCustom && setValue("locales", []);
    }, [permission]);

    const i18N = useI18N();

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Manage content based on language`}</Typography>
                </div>
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Content models"}
                    value={permission}
                    onChange={value => setPermission(value)}
                >
                    {localesPermissionOptions.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
            {showCustomPermission && (
                <Cell span={12}>
                    <PermissionSelector
                        value={value}
                        setValue={setValue}
                        selectorKey={"locales"}
                        dataList={{
                            loading: false,
                            error: null,
                            list: i18N
                                .getLocales()
                                .map(locale => ({ ...locale, name: locale.code }))
                        }}
                    />
                </Cell>
            )}
        </Fragment>
    );
};
