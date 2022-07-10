import React, { useCallback } from "react";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as HomeIcon } from "~/admin/assets/round-home-24px.svg";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePage } from "~/pageEditor/hooks/usePage";

export const SetAsHomepageButton: React.FC = React.memo(() => {
    const [page] = usePage();
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();

    const { settings, updateSettingsMutation, isSpecialPage } = usePageBuilderSettings();

    const setAsHomepage = useCallback(async () => {
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

        history.push(`/page-builder/pages?id=${page.id}`);

        // Let's wait a bit, because we are also redirecting the user.
        setTimeout(() => showSnackbar("New homepage set successfully!"), 500);
    }, [page.id]);

    return (
        <ConfirmationDialog
            message={
                <span>
                    You&#39;re about to set this page as your new homepage, are you sure you want to
                    continue?
                    <br />
                    Note that the page will automatically be published.
                </span>
            }
        >
            {({ showConfirmation }) => (
                <MenuItem
                    disabled={isSpecialPage(page.pid!, "home")}
                    onClick={() => showConfirmation(setAsHomepage)}
                >
                    <ListItemGraphic>
                        <Icon icon={<HomeIcon />} />
                    </ListItemGraphic>
                    Set as homepage
                </MenuItem>
            )}
        </ConfirmationDialog>
    );
});

SetAsHomepageButton.displayName = "SetAsHomepageButton";
