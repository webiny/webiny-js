import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-page-builder/admin/assets/more_vert.svg";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";
import { ReactComponent as HomeIcon } from "@webiny/app-page-builder/admin/assets/round-home-24px.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem, Menu } from "@webiny/ui/Menu";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "@webiny/app-page-builder/admin/hooks/useSiteStatus";
import { css } from "emotion";
import { Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { setHomePage } from "./graphql";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { getPlugins } from "@webiny/plugins";
import { PbPageDetailsHeaderRightOptionsMenuItemPlugin } from "@webiny/app-page-builder/types";
import { useConfigureDomainDialog } from "@webiny/app-page-builder/utils/useConfigureDomain";

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
    const {
        pageDetails: { page }
    } = props;

    const { getPageUrl, getPagePreviewUrl, getDomain } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getDomain());

    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        title: "Delete page",
        message: (
            <span>
                You&#39;re about to set the <strong>{page.title}</strong> page as your new homepage,
                are you sure you want to continue?{" "}
                {!page.published && "Note that your page will be automatically published."}
            </span>
        )
    });

    const { showConfigureDomainDialog } = useConfigureDomainDialog(getDomain(), refreshSiteStatus);

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = window.Cypress ? "_self" : "_blank";

    const handlePreviewClick = () => {
        const url = page.locked ? getPageUrl(page) : getPagePreviewUrl(page);

        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureDomainDialog();
        }
    };

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
            {page.locked ? (
                <MenuItem onClick={handlePreviewClick}>
                    <ListItemGraphic>
                        <Icon
                            data-testid="pb-page-details-header-page-options-menu-preview"
                            icon={<PreviewIcon />}
                        />
                    </ListItemGraphic>
                    View
                </MenuItem>
            ) : (
                <MenuItem onClick={handlePreviewClick}>
                    <ListItemGraphic>
                        <Icon
                            data-testid="pb-page-details-header-page-options-menu-preview"
                            icon={<PreviewIcon />}
                        />
                    </ListItemGraphic>
                    Preview
                </MenuItem>
            )}

            <Mutation mutation={setHomePage}>
                {update => (
                    <MenuItem
                        className={classNames({ disabled: page.isHomePage })}
                        onClick={() => {
                            showConfirmation(async () => {
                                const response = await update({
                                    variables: {
                                        id: page.id
                                    }
                                });

                                const { error } = response.data.pageBuilder.setHomePage;
                                if (error) {
                                    showSnackbar(error.message);
                                } else {
                                    showSnackbar("Homepage set successfully!");
                                    if (!page.published) {
                                        props.refreshPages();
                                    }
                                }
                            });
                        }}
                    >
                        <ListItemGraphic>
                            <Icon icon={<HomeIcon />} />
                        </ListItemGraphic>
                        Set as homepage
                    </MenuItem>
                )}
            </Mutation>

            {getPlugins<PbPageDetailsHeaderRightOptionsMenuItemPlugin>(
                "pb-page-details-header-right-options-menu-item"
            ).map(plugin => (
                <React.Fragment key={plugin.name}>{plugin.render(props)}</React.Fragment>
            ))}
        </Menu>
    );
};

export default PageOptionsMenu;
