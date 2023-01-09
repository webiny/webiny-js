import React, { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { ReactComponent as HomeIcon } from "~/admin/assets/round-home-24px.svg";
import { ReactComponent as DuplicateIcon } from "~/editor/assets/icons/round-queue-24px.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem, Menu } from "@webiny/ui/Menu";
import { DUPLICATE_PAGE } from "~/admin/graphql/pages";
import * as GQLCache from "~/admin/views/Pages/cache";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { css } from "emotion";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { plugins } from "@webiny/plugins";
import {
    PbPageData,
    PbPageDetailsHeaderRightOptionsMenuItemPlugin,
    PageBuilderSecurityPermission
} from "~/types";
import { SecureView } from "@webiny/app-security";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

interface PageOptionsMenuProps {
    page: PbPageData;
}
const PageOptionsMenu: React.FC<PageOptionsMenuProps> = props => {
    const { page } = props;
    const { settings, isSpecialPage, getPageUrl, getWebsiteUrl, updateSettingsMutation } =
        usePageBuilderSettings();
    const client = useApolloClient();
    const { history } = useRouter();

    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());
    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    const pageBuilder = useAdminPageBuilder();

    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        title: "Set as homepage",
        message: (
            <span>
                You&#39;re about to set the <strong>{page.title}</strong> page as your new homepage,
                are you sure you want to continue?{" "}
                {page.status !== "published" &&
                    "Note that your page will be automatically published."}
            </span>
        )
    });

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";
    const url = getPageUrl(page, !page.locked);

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    const handleDuplicateClick = useCallback(async () => {
        try {
            await client.mutate({
                mutation: DUPLICATE_PAGE,
                variables: { id: page.id },
                update(cache, { data }) {
                    if (data.pageBuilder.duplicatePage.error) {
                        return;
                    }

                    GQLCache.addPageToListCache(cache, data.pageBuilder.duplicatePage.data);
                    showSnackbar(`Duplicated "${page.title}".`);
                    history.push(
                        `/page-builder/pages?id=${encodeURIComponent(
                            data.pageBuilder.duplicatePage.data.id
                        )}`
                    );
                }
            });
        } catch (error) {
            showSnackbar(error.message);
        }
    }, [page]);

    const { identity, getPermission } = useSecurity();

    const canDuplicate = useMemo(() => {
        const permission = getPermission<PageBuilderSecurityPermission>("pb.page");
        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("w");
    }, [identity]);

    const previewButtonLabel = page.locked ? "View" : "Preview";
    return (
        <Menu
            className={menuStyles}
            handle={
                <IconButton
                    data-testid="pb-page-details-header-page-options-menu"
                    icon={<MoreVerticalIcon />}
                />
            }
        >
            <MenuItem onClick={handlePreviewClick}>
                <ListItemGraphic>
                    <Icon
                        data-testid="pb-page-details-header-page-options-menu-preview"
                        icon={<PreviewIcon />}
                    />
                </ListItemGraphic>
                {previewButtonLabel}
            </MenuItem>

            <SecureView permission={"pb.settings"}>
                <MenuItem
                    className={classNames({ disabled: isSpecialPage(page.pid, "home") })}
                    onClick={() => {
                        showConfirmation(async () => {
                            if (!page.locked) {
                                const response = await pageBuilder.publishPage(page, {
                                    client: pageBuilder.client
                                });
                                /**
                                 * In case of exit in "publishPage" lifecycle, "publishPage" hook will return undefined,
                                 * indicating an immediate exit.
                                 */
                                if (!response) {
                                    return;
                                }
                                const { error } = response;
                                if (error) {
                                    return showSnackbar(error.message);
                                }
                            }

                            const [updateSettings] = updateSettingsMutation;
                            const response = await updateSettings({
                                variables: {
                                    data: {
                                        pages: {
                                            ...settings.pages,
                                            home: page.id
                                        }
                                    }
                                }
                            });

                            const { error } = response.data.pageBuilder.updateSettings;
                            if (error) {
                                showSnackbar(error.message);
                            } else {
                                showSnackbar("Homepage set successfully!");
                            }
                        });
                    }}
                >
                    <ListItemGraphic>
                        <Icon icon={<HomeIcon />} />
                    </ListItemGraphic>
                    Set as homepage
                </MenuItem>
            </SecureView>

            {canDuplicate && (
                <MenuItem onClick={handleDuplicateClick}>
                    <ListItemGraphic>
                        <Icon icon={<DuplicateIcon />} />
                    </ListItemGraphic>
                    Duplicate
                </MenuItem>
            )}

            {plugins
                .byType<PbPageDetailsHeaderRightOptionsMenuItemPlugin>(
                    "pb-page-details-header-right-options-menu-item"
                )
                .map(plugin => (
                    <React.Fragment key={plugin.name}>{plugin.render(props)}</React.Fragment>
                ))}
        </Menu>
    );
};

export default PageOptionsMenu;
