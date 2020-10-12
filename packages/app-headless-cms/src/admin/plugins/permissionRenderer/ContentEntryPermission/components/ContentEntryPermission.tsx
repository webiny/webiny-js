import React, { useEffect, Fragment, useReducer, useCallback } from "react";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import get from "lodash.get";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { ContentEntryPermissionBasedOnLanguage } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/ContentEntryPermission/components/ContentEntryBasedOnLanguagePermission";

import { PermissionSelector, PermissionSelectorWrapper } from "../../components/PermissionSelector";
import { LIST_CONTENT_MODELS } from "@webiny/app-headless-cms/admin/viewsGraphql";
import { LIST_CONTENT_MODEL_GROUPS } from "@webiny/app-headless-cms/admin/views/ContentModelGroups/graphql";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { flexClass } from "../../components/StyledComponents";
import { reducer, initialState, actionTypes, contentModelPermissionOptions } from "../utils";
import { PermissionAccessLevel } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const ContentEntryPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, permission, showModelSelector, showGroupSelector, synced } = state;

    useEffect(() => {
        if (value && value.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, permission]);

    useEffect(() => {
        setValue(permission);
    }, [permission]);

    // Data fetching
    const {
        data: contentModelData,
        error: contentModelError,
        loading: contentModelLoading
    } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(contentModelData, "listContentModels.data", []).map(contentModel => ({
        id: contentModel.modelId,
        name: contentModel.name
    }));

    const {
        data: contentModelGroupData,
        error: contentModelGroupError,
        loading: contentModelGroupLoading
    } = useQuery(LIST_CONTENT_MODEL_GROUPS);
    const contentModelGroups = get(
        contentModelGroupData,
        "contentModelGroups.data",
        []
    ).map(contentModelGroup => ({ id: contentModelGroup.slug, name: contentModelGroup.name }));

    const updatePermission = useCallback(
        (key, value) =>
            dispatch({
                type: actionTypes.UPDATE_PERMISSION,
                payload: { key, value }
            }),
        []
    );

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Manage records`}</Typography>
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
                    {contentModelPermissionOptions.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
            {showModelSelector && (
                <PermissionSelectorWrapper>
                    <PermissionSelector
                        value={permission}
                        setValue={updatePermission}
                        selectorKey={"models"}
                        dataList={{
                            loading: contentModelLoading,
                            error: contentModelError,
                            list: contentModels
                        }}
                    />
                </PermissionSelectorWrapper>
            )}
            {showGroupSelector && (
                <PermissionSelectorWrapper>
                    <PermissionSelector
                        value={permission}
                        setValue={updatePermission}
                        selectorKey={"groups"}
                        dataList={{
                            loading: contentModelGroupLoading,
                            error: contentModelGroupError,
                            list: contentModelGroups
                        }}
                    />
                </PermissionSelectorWrapper>
            )}
            <ContentEntryPermissionBasedOnLanguage value={permission} setValue={updatePermission} />
            <PermissionAccessLevel value={permission} setValue={updatePermission} publish={true} />
        </Fragment>
    );
};
