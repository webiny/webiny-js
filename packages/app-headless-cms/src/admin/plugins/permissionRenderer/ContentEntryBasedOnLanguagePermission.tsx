import React, { useEffect, Fragment, useReducer } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { PermissionSelector } from "./PermissionSelector";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import get from "lodash.get";
const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE = "cms.manage.contentEntries.locales";

const localesPermissionOptions = [
    {
        id: 0,
        value: PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE,
        label: "All Languages"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE + "#custom",
        label: "Only specific languages"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

const actionTypes = {
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

const reducer = (currentState, action) => {
    let permissionLevel = currentState.permissionLevel;
    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            const showCustomPermission = permissionLevel.includes("custom");

            return {
                ...currentState,
                permissionLevel,
                showCustomPermission
            };
        case actionTypes.SYNC_PERMISSIONS:
            const currentLocales = action.payload;

            let isCustom = false;
            if (currentLocales.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE + "#custom";
                isCustom = true;
            } else {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE;
                isCustom = false;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showCustomPermission: isCustom
            };
        case actionTypes.RESET:
            return {
                ...initialState
            };
        default:
            throw new Error("Unrecognised action: " + action);
    }
};

const initialState = {
    permissionLevel: PERMISSION_CMS_CONTENT_ENTRY_BY_LOCALE,
    showCustomPermission: false,
    synced: false
};

export const ContentEntryPermissionBasedOnLanguage = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, showCustomPermission, synced } = state;

    useEffect(() => {
        !showCustomPermission && setValue("locales", []);
    }, [showCustomPermission]);

    const currentLocales = get(value, "locales", []);

    useEffect(() => {
        if (currentLocales && currentLocales.length && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: currentLocales });
        }
    }, [currentLocales, synced]);

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
                    value={permissionLevel}
                    onChange={value =>
                        dispatch({ type: actionTypes.SET_PERMISSION_LEVEL, payload: value })
                    }
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
