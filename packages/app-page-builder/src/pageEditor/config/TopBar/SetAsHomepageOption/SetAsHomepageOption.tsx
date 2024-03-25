import React, { useCallback } from "react";
import { ReactComponent as HomeIcon } from "@material-design-icons/svg/round/home.svg";
import { useConfirmationDialog } from "@webiny/app-admin";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { usePage } from "~/pageEditor/hooks/usePage";
import { useNavigatePage } from "~/admin/hooks/useNavigatePage";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { PageEditorConfig } from "~/pageEditor/editorConfig/PageEditorConfig";

const { TopBar } = PageEditorConfig;

export const SetAsHomepageOption = () => {
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

    return (
        <TopBar.DropdownAction.MenuItem
            label={"Set as homepage"}
            onClick={() => showConfirmation(setPageAsHomepage)}
            icon={<HomeIcon />}
            disabled={isSpecialPage(page.pid!, "home")}
        />
    );
};
