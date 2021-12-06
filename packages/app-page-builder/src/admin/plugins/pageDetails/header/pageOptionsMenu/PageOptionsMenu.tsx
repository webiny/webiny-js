import React, { useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as MoreVerticalIcon } from "../../../../assets/more_vert.svg";
import { ReactComponent as PreviewIcon } from "../../../../assets/visibility.svg";
import { ReactComponent as HomeIcon } from "../../../../assets/round-home-24px.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem, Menu } from "@webiny/ui/Menu";
import { usePageBuilderSettings } from "../../../../hooks/usePageBuilderSettings";
import { useSiteStatus } from "../../../../hooks/useSiteStatus";
import { css } from "emotion";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useConfigureWebsiteUrlDialog } from "../../../../hooks/useConfigureWebsiteUrl";
import { plugins } from "@webiny/plugins";
import { PbPageDetailsHeaderRightOptionsMenuItemPlugin } from "../../../../../types";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";
import { SecureView } from "@webiny/app-security";

const PUBLISH_PAGE = gql`
    mutation PbPublishPage($id: ID!) {
        pageBuilder {
            publishPage(id: $id) {
                data {
                    id
                    path
                    status
                    locked
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const PageOptionsMenu = props => {
    const { page } = props;
    const { settings, isSpecialPage, getPageUrl, getWebsiteUrl, updateSettingsMutation } =
        usePageBuilderSettings();

    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());
    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    const publishPageMutation = useMutation(PUBLISH_PAGE);

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
    const target = window.Cypress ? "_self" : "_blank";
    const url = getPageUrl(page, !page.locked);

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

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
                    className={classNames({ disabled: isSpecialPage(page, "home") })}
                    onClick={() => {
                        showConfirmation(async () => {
                            if (!page.locked) {
                                const [publish] = publishPageMutation;
                                await publish({
                                    variables: { id: page.id }
                                });
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

            {plugins.byType(PbPageDetailsHeaderRightOptionsMenuItemPlugin).map(plugin => (
                <React.Fragment key={plugin.name}>{plugin.render(props)}</React.Fragment>
            ))}
        </Menu>
    );
};

export default PageOptionsMenu;
