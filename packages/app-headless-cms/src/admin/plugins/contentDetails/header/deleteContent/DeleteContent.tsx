import React, { useCallback, useMemo } from "react";
import useReactRouter from "use-react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";
import { createDeleteMutation } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import I18NValue from "@webiny/app-i18n/components/I18NValue";
import get from "lodash/get";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/plugins/content/header/delete");

const DeleteContent = ({ contentModel, content, dataList, getLoading }) => {
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const { showDialog } = useDialog();

    const DELETE_CONTENT = useMemo(() => {
        return createDeleteMutation(contentModel);
    }, [contentModel.modelId]);

    const [deleteContentMutation] = useMutation(DELETE_CONTENT);

    const title = I18NValue({ value: get(content, "meta.title") });

    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete page`,
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
            const { data: res } = await deleteContentMutation({
                variables: { id: content.meta.parent }
            });

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
        <Tooltip content={t`Delete`} placement={"top"}>
            <IconButton
                icon={<DeleteIcon />}
                onClick={confirmDelete}
                disabled={!content.id || getLoading()}
            />
        </Tooltip>
    );
};

export default DeleteContent;
