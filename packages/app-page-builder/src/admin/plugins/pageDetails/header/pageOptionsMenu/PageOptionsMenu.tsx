import React, { useCallback, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";
import { ReactComponent as HomeIcon } from "~/admin/assets/round-home-24px.svg";
import { ReactComponent as GridViewIcon } from "@material-design-icons/svg/outlined/grid_view.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem, Menu } from "@webiny/ui/Menu";
import {
    CREATE_TEMPLATE_FROM_PAGE,
    LIST_PAGE_TEMPLATES
} from "~/admin/views/PageTemplates/graphql";
import CreatePageTemplateDialog from "~/admin/views/PageTemplates/CreatePageTemplateDialog";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { css } from "emotion";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { plugins } from "@webiny/plugins";
import { PbPageData, PbPageDetailsHeaderRightOptionsMenuItemPlugin, PbPageTemplate } from "~/types";
import { SecureView } from "@webiny/app-security";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { useFolders } from "@webiny/app-aco";
import { useTemplatesPermissions } from "~/hooks/permissions";
import { PreviewPage } from "./PreviewPage";
import { DuplicatePage } from "./DuplicatePage";

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

const PageOptionsMenu = (props: PageOptionsMenuProps) => {
    const { page } = props;
    const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState<boolean>(false);
    const { settings, isSpecialPage, updateSettingsMutation } = usePageBuilderSettings();
    const client = useApolloClient();

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

    const handleCreateTemplateClick = useCallback(
        async (formData: Pick<PbPageTemplate, "title" | "slug" | "description">) => {
            try {
                const { data: res } = await client.mutate({
                    mutation: CREATE_TEMPLATE_FROM_PAGE,
                    variables: { pageId: page.id, data: formData },
                    refetchQueries: [{ query: LIST_PAGE_TEMPLATES }]
                });

                const { error, data } = res.pageBuilder.pageTemplate;
                if (error) {
                    showSnackbar(error.message);
                } else {
                    setIsCreateTemplateDialogOpen(false);
                    showSnackbar(`Template "${data.title}" created successfully.`);
                }
            } catch (error) {
                showSnackbar(error.message);
            }
        },
        [page]
    );

    const { folderLevelPermissions: flp } = useFolders();
    const { canCreate: templatesCanCreate } = useTemplatesPermissions();

    const canCreateTemplate = templatesCanCreate();

    const folderId = page.wbyAco_location?.folderId;
    const flpCanManageContent = flp.canManageContent(folderId);

    const isTemplatePage = page.content?.data?.template;
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
            <PreviewPage />

            {flpCanManageContent && (
                <>
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

                    <DuplicatePage />

                    {canCreateTemplate && !isTemplatePage && (
                        <MenuItem onClick={() => setIsCreateTemplateDialogOpen(true)}>
                            <ListItemGraphic>
                                <Icon icon={<GridViewIcon />} />
                            </ListItemGraphic>
                            Save as a template
                        </MenuItem>
                    )}

                    {isCreateTemplateDialogOpen && (
                        <CreatePageTemplateDialog
                            onClose={() => setIsCreateTemplateDialogOpen(false)}
                            onSubmit={handleCreateTemplateClick}
                        />
                    )}
                </>
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
