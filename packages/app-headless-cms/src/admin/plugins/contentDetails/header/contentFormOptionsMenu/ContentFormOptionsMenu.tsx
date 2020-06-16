import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import get from "lodash/get";
import { IconButton } from "@webiny/ui/Button";
import I18NValue from "@webiny/app-i18n/components/I18NValue";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { createDeleteMutation } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns(
    "app-headless-cms/admin/plugins/content-details/header/content-form-options-menu"
);

import { ReactComponent as MoreVerticalIcon } from "@webiny/app-headless-cms/admin/icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";

const menuStyles = css({
    width: 250,
    right: -105,
    left: "auto !important",
    ".disabled": {
        opacity: 0.5,
        pointerEvents: "none"
    }
});

const ContentFormOptionsMenu = ({ contentModel, content, dataList, getLoading, setLoading }) => {
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { showDialog } = useDialog();

    const DELETE_CONTENT = useMemo(() => {
        return createDeleteMutation(contentModel);
    }, [contentModel.modelId]);

    const [deleteContentMutation] = useMutation(DELETE_CONTENT);

    const title = I18NValue({ value: get(content, "meta.title") });

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete content entry`,
        message: (
            <p>
                {t`You are about to delete this content entry and all of its revisions!
                    Are you sure you want to permanently delete {title}?`({
                    title: <strong>{title}</strong>
                })}
            </p>
        )
    });

    const confirmDelete = useCallback(() => {
        showConfirmation(async () => {
            setLoading(true);
            const { data: res } = await deleteContentMutation({
                variables: { revision: content.meta.parent }
            });

            setLoading(false);

            dataList.refresh();

            const { error } = get(res, "content");
            if (error) {
                return showDialog(error.message, { title: t`Could not delete content` });
            }

            showSnackbar(t`{title} was deleted successfully!`({ title: <strong>{title}</strong> }));

            const query = new URLSearchParams(location.search);
            query.delete("id");
            history.push({ search: query.toString() });
        });
    }, null);

    return (
        <Menu className={menuStyles} handle={<IconButton icon={<MoreVerticalIcon />} />}>
            <MenuItem onClick={confirmDelete} disabled={!content.id || getLoading()}>
                <ListItemGraphic>
                    <Icon icon={<DeleteIcon />} />
                </ListItemGraphic>
                Delete
            </MenuItem>
        </Menu>
    );
};

export default ContentFormOptionsMenu;
