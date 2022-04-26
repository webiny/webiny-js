import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import get from "lodash/get";
import { IconButton } from "@webiny/ui/Button";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import {
    CmsEntryDeleteMutationResponse,
    CmsEntryDeleteMutationVariables,
    createDeleteMutation
} from "~/admin/graphql/contentEntries";
import usePermission from "~/admin/hooks/usePermission";
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { removeEntryFromListCache } from "../../cache";
import { useMutation } from "~/admin/hooks";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";

const t = i18n.ns(
    "app-headless-cms/admin/plugins/content-details/header/content-form-options-menu"
);

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const ContentFormOptionsMenu: React.FC = () => {
    const { contentModel, entry, loading, setLoading, listQueryVariables } = useContentEntry();
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { showDialog } = useDialog();
    const { canDelete } = usePermission();

    const DELETE_CONTENT = useMemo(() => {
        return createDeleteMutation(contentModel);
    }, [contentModel.modelId]);

    const [deleteContentMutation] = useMutation<
        CmsEntryDeleteMutationResponse,
        CmsEntryDeleteMutationVariables
    >(DELETE_CONTENT);

    const title = get(entry, "meta.title");

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete content entry`,
        message: (
            <p>
                {t`You are about to delete this content entry and all of its revisions!`}
                <br />
                {t`Are you sure you want to permanently delete {title}?`({
                    title: <strong>{title}</strong>
                })}
            </p>
        ),
        dataTestId: "cms.content-form.header.delete-dialog"
    });

    const confirmDelete = useCallback((): void => {
        showConfirmation(async (): Promise<void> => {
            setLoading(true);
            const [uniqueId] = entry.id.split("#");
            await deleteContentMutation({
                variables: { revision: uniqueId },
                update(cache, response) {
                    if (!response.data) {
                        showDialog("Missing response data on Delete Entry Mutation.", {
                            title: t`Could not delete content`
                        });
                        return;
                    }
                    const { error } = response.data.content;
                    if (error) {
                        showDialog(error.message, { title: t`Could not delete content` });
                        return;
                    }

                    setLoading(false);
                    removeEntryFromListCache(contentModel, cache, entry, listQueryVariables);

                    showSnackbar(
                        t`{title} was deleted successfully!`({ title: <strong>{title}</strong> })
                    );
                    history.push(`/cms/content-entries/${contentModel.modelId}`);
                }
            });

            setLoading(false);
        });
    }, [entry]);

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <Menu
            className={menuStyles}
            handle={
                <IconButton
                    icon={<MoreVerticalIcon />}
                    data-testid={"cms.content-form.header.more-options"}
                />
            }
        >
            <MenuItem
                onClick={confirmDelete}
                disabled={!entry.id || loading}
                data-testid={"cms.content-form.header.delete"}
            >
                <ListItemGraphic>
                    <Icon icon={<DeleteIcon />} />
                </ListItemGraphic>
                Delete
            </MenuItem>
        </Menu>
    );
};

export default ContentFormOptionsMenu;
