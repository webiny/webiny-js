// @flow
import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-page-builder/admin/assets/more_vert.svg";
import { ReactComponent as PreviewIcon } from "@webiny/app-page-builder/admin/assets/visibility.svg";
import { ReactComponent as HomeIcon } from "@webiny/app-page-builder/admin/assets/round-home-24px.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem, Menu } from "@webiny/ui/Menu";
import { withConfirmation, type WithConfirmationProps } from "@webiny/ui/ConfirmationDialog";
import { usePageBuilderSettings } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings";
import { css } from "emotion";
import { Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { setHomePage } from "./graphql";

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

type Props = WithConfirmationProps;

const PageOptionsMenu = (props: Props) => {
    const {
        showConfirmation,
        pageDetails: { page }
    } = props;

    const { getPagePreviewUrl } = usePageBuilderSettings();
    const { showSnackbar } = useSnackbar();

    return (
        <Menu
            className={menuStyles}
            handle={<IconButton icon={<MoreVerticalIcon />} />}
            openSide={"left"}
        >
            <MenuItem onClick={() => window.open(getPagePreviewUrl(page), "_blank")}>
                <ListItemGraphic>
                    <Icon icon={<PreviewIcon />} />
                </ListItemGraphic>
                Preview
            </MenuItem>

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
        </Menu>
    );
};

export default withConfirmation(props => {
    const {
        pageDetails: { page }
    } = props;

    return {
        message: (
            <span>
                You&#39;re about to set the <strong>{page.title}</strong> page as your new homepage,
                are you sure you want to continue?{" "}
                {!page.published && "Note that your page will be automatically published."}
            </span>
        )
    };
})(PageOptionsMenu);
