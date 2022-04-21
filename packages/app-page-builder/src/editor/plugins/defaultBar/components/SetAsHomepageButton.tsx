import React from "react";
import { useRecoilValue } from "recoil";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useRouter } from "@webiny/react-router";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { pageAtom, PageAtomType } from "~/editor/recoil/modules";
import { ReactComponent as HomeIcon } from "~/admin/assets/round-home-24px.svg";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";

const SetAsHomepageButton: React.FC = () => {
    const page = useRecoilValue(pageAtom) as Required<PageAtomType>;
    const { history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();

    const { settings, updateSettingsMutation, isSpecialPage } = usePageBuilderSettings();

    return (
        <ConfirmationDialog
            message={
                <span>
                    You&#39;re about to set this page as your new homepage, are you sure you want to
                    continue? Note that the page will automatically be published.
                </span>
            }
        >
            {({ showConfirmation }) => (
                <MenuItem
                    disabled={isSpecialPage(page, "home")}
                    onClick={() => {
                        showConfirmation(async () => {
                            const publishPageResult = await pageBuilder.publishPage(
                                page as { id: string },
                                {
                                    client: pageBuilder.client
                                }
                            );
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
                        });
                    }}
                >
                    <ListItemGraphic>
                        <Icon icon={<HomeIcon />} />
                    </ListItemGraphic>
                    Set as homepage
                </MenuItem>
            )}
        </ConfirmationDialog>
    );
};

export default React.memo(SetAsHomepageButton);
