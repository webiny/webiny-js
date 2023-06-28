import React, { useCallback } from "react";
import get from "lodash/get";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import usePermission from "~/admin/hooks/usePermission";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/filled/delete.svg";
import { useCms } from "~/admin/hooks";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { parseIdentifier } from "@webiny/utils";

const t = i18n.ns("app-headless-cms/admin/components/content-details/header/delete-item");

export const DeleteItem: React.FC = () => {
    const { deleteEntry } = useCms();
    const { contentModel, entry, loading, setLoading, listQueryVariables } = useContentEntry();
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { showDialog } = useDialog();
    const { canDelete } = usePermission();

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

            const { id: entryId } = parseIdentifier(entry.id);
            const { error } = await deleteEntry({
                model: contentModel,
                entry,
                id: entryId,
                listQueryVariables
            });

            setLoading(false);

            if (error) {
                showDialog(error.message, { title: t`Could not delete content` });
                return;
            }

            showSnackbar(t`{title} was deleted successfully!`({ title: <strong>{title}</strong> }));
            history.push(`/cms/content-entries/${contentModel.modelId}`);
        });
    }, [entry]);

    if (!canDelete(entry, "cms.contentEntry")) {
        return null;
    }

    return (
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
    );
};
