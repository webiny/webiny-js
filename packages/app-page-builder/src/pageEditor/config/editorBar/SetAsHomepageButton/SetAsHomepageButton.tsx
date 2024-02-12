import React, { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as HomeIcon } from "~/admin/assets/round-home-24px.svg";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePage } from "~/pageEditor/hooks/usePage";
import { createDecorator } from "@webiny/react-composition";
import { PageOptionsMenu } from "~/pageEditor";
import { useConfirmationDialog } from "@webiny/app-admin";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";

export const SetAsHomepageButtonPlugin = createDecorator(PageOptionsMenu, Original => {
    return function SetAsHomepageButton({ items, ...props }) {
        const [page] = usePage();
        const { navigateToLatestFolder } = useNavigatePage();
        const { showSnackbar } = useSnackbar();
        const pageBuilder = useAdminPageBuilder();
        const { showConfirmation } = useConfirmationDialog({
            message: (
                <span>
                    You&#39;re about to set this page as your new homepage, are you sure you want to
                    continue?
                    <br />
                    Note that the page will automatically be published.
                </span>
            )
        });

        const { settings, updateSettingsMutation, isSpecialPage } = usePageBuilderSettings();

        const setPageAsHomepage = useCallback(async () => {
            const publishPageResult = await pageBuilder.publishPage(page as { id: string }, {
                client: pageBuilder.client
            });
            /**
             * In case of exit in "publishPage" lifecycle, "publishPage" hook will return undefined,
             * indicating an immediate exit.
             */
            if (!publishPageResult) {
                return;
            }

            if (publishPageResult.error) {
                return showSnackbar(publishPageResult.error.message);
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
                return showSnackbar(error.message);
            }

            navigateToLatestFolder();

            // Let's wait a bit, because we are also redirecting the user.
            setTimeout(() => showSnackbar("New homepage set successfully!"), 500);
        }, [page.id]);

        const setAsHomepageItem = (
            <MenuItem
                onClick={() => showConfirmation(setPageAsHomepage)}
                disabled={isSpecialPage(page.pid!, "home")}
            >
                <ListItemGraphic>
                    <Icon icon={<HomeIcon />} />
                </ListItemGraphic>
                Set as homepage
            </MenuItem>
        );

        return <Original {...props} items={[setAsHomepageItem, ...items]} />;
    };
});
