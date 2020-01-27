import React from "react";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as RefreshIcon } from "@webiny/app-page-builder/admin/assets/baseline-autorenew-24px.svg";
import { ListItemGraphic } from "@webiny/ui/List";
import { MenuItem } from "@webiny/ui/Menu";
import { Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import classNames from "classnames";
import { INVALIDATE_SSR_CACHE } from "./graphql";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

const InvalidateSsrCache = props => {
    const {
        pageDetails: { page }
    } = props;

    const { showSnackbar } = useSnackbar();
    const { showConfirmation } = useConfirmationDialog({
        title: "Invalidate cache",
        message: (
            <span>
                You&#39;re about to invalidate the cache for <strong>{page.title}</strong> page, are
                you sure you want to continue?
                <br />
                <br />
                Note that sometimes the cache invalidation process may take up to 10 minutes.
            </span>
        )
    });

    return (
        <Mutation mutation={INVALIDATE_SSR_CACHE}>
            {update => (
                <MenuItem
                    className={classNames({ disabled: !page.published })}
                    onClick={() => {
                        showConfirmation(async () => {
                            const response = await update({
                                variables: {
                                    revision: page.id,
                                    refresh: true
                                }
                            });

                            const { error } = response.data.pageBuilder.invalidateSsrCache;
                            if (error) {
                                showSnackbar(error.message);
                            } else {
                                showSnackbar("Cache invalidated successfully!");
                                if (!page.published) {
                                    props.refreshPages();
                                }
                            }
                        });
                    }}
                >
                    <ListItemGraphic>
                        <Icon icon={<RefreshIcon />} />
                    </ListItemGraphic>
                    Invalidate cache
                </MenuItem>
            )}
        </Mutation>
    );
};

export default InvalidateSsrCache;
