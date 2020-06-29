import React, { useState, useEffect } from "react";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/menus");
import { ReactComponent as HeadlessCmsIcon } from "../../icons/devices_other-black-24px.svg";
import { ReactComponent as EnvironmentIcon } from "../../icons/call_split-24px.svg";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";
import { useNavigation } from "@webiny/app-admin/plugins/Menu/Navigation/components";
import EnvironmentSelectorDialog from "./../../components/EnvironmentSelectorDialog";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { registerPlugins, unregisterPlugin, getPlugin, getPlugins } from "@webiny/plugins";
import { AdminGlobalSearchPlugin } from "@webiny/app-admin/types";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "./../../viewsGraphql";
import get from "lodash/get";

const style = {
    itemsList: css({
        paddingTop: 10,
        paddingBottom: 10,
        "> li": {
            display: "flex",
            alignItems: "center",
            paddingTop: 2,
            paddingBottom: 2
        }
    }),
    environmentLi: css({
        color: "var(--mdc-theme-text-secondary-on-background)"
    }),
    environmentLiIcon: css({
        width: 16,
        height: 16
    }),
    environmentLiLabel: css({
        marginLeft: 2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }),
    changeEnvironmentLiLink: css({
        color: "var(--mdc-theme-primary)"
    })
};

const HeadlessCmsMenu = ({ Menu, children }) => {
    const [dialogOpened, setDialogOpened] = useState(false);
    const { hideMenu } = useNavigation();

    const {
        environments: { currentEnvironment }
    } = useCms();

    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);

    const contentModelGroups = get(response, "data.listContentModelGroups.data", []);

    const cmgHash = contentModelGroups.reduce((returnValue, currentValue) => {
        return (
            returnValue +
            currentValue.contentModels.reduce((returnValue, currentValue) => {
                return returnValue + currentValue.modelId;
            }, "")
        );
    }, "");

    // Generate "admin-global-search" plugins - enables the user to search content via the global search bar.
    useEffect(() => {
        // 1. Unregister all previously registered plugins.
        getPlugins<AdminGlobalSearchPlugin>("admin-global-search")
            .filter(item => item.name.startsWith("admin-global-search-headless-cms"))
            .forEach(item => unregisterPlugin(item.name));

        // 2. Register a new set of plugins via the latest list of content models.
        contentModelGroups.forEach(group => {
            group.contentModels.forEach(contentModel => {
                const pluginName = "admin-global-search-headless-cms-" + contentModel.modelId;
                if (!getPlugin(pluginName)) {
                    registerPlugins({
                        type: "admin-global-search",
                        name: "admin-global-search-headless-cms-" + contentModel.modelId,
                        route: "/cms/content-models/manage/" + contentModel.modelId,
                        label: contentModel.name
                    });
                }
            });
        });
    }, [get(currentEnvironment, "id"), cmgHash]);

    return (
        <Menu
            onClick={toggleMenu => !dialogOpened && toggleMenu()}
            name="headless-cms"
            icon={<HeadlessCmsIcon />}
            label={
                <ul className={style.itemsList}>
                    <li>{t`Headless CMS`}</li>
                    <li className={style.environmentLi}>
                        <EnvironmentIcon className={style.environmentLiIcon} />
                        <Typography use={"caption"} className={style.environmentLiLabel}>
                            {currentEnvironment ? currentEnvironment.name : t`N/A`}
                        </Typography>
                    </li>
                    <li>
                        <Typography use={"caption"}>
                            <div
                                className={style.changeEnvironmentLiLink}
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDialogOpened(true);
                                }}
                            >{t`Change environment`}</div>
                        </Typography>
                        <EnvironmentSelectorDialog
                            open={dialogOpened}
                            onClose={() => {
                                setDialogOpened(false);
                                hideMenu();
                            }}
                        />
                    </li>
                </ul>
            }
        >
            {children}
        </Menu>
    );
};

export default HeadlessCmsMenu;
