import React, { useCallback } from "react";
import { ReactComponent as Delete } from "@material-design-icons/svg/outlined/delete.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useCms, useModel, usePermission } from "~/admin/hooks";
import { useConfirmationDialog, useDialog, useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { RecordEntry } from "../../types";
import { useNavigateFolder, useRecords } from "@webiny/app-aco";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    record: RecordEntry;
}

export const RecordActionDelete: React.VFC<Props> = ({ record }) => {
    const { deleteEntry } = useCms();
    const { canDelete } = usePermission();
    const { model } = useModel();
    const { showSnackbar } = useSnackbar();
    const { showDialog } = useDialog();
    const { showConfirmation } = useConfirmationDialog({
        title: t`Delete content entry`,
        message: (
            <p>
                {t`You are about to delete this content entry and all of its revisions!`}
                <br />
                {t`Are you sure you want to permanently delete {title}?`({
                    title: <strong>{record.title}</strong>
                })}
            </p>
        ),
        dataTestId: "cms.content-form.header.delete-dialog"
    });
    const { navigateToLatestFolder } = useNavigateFolder();
    const { removeRecordFromCache } = useRecords();

    const onClick = useCallback((): void => {
        showConfirmation(async (): Promise<void> => {
            const { id } = parseIdentifier(record.id);
            const { error } = await deleteEntry({
                model,
                entry: {
                    id: record.id
                },
                id
            });

            if (error) {
                showDialog(error.message, { title: t`Could not delete content` });
                return;
            }

            showSnackbar(
                t`{title} was deleted successfully!`({ title: <strong>{record.title}</strong> })
            );
            removeRecordFromCache(record.id);
            navigateToLatestFolder();
        });
    }, [record.id]);

    if (!canDelete(record.original, "cms.contentEntry")) {
        console.log("Does not have permission to delete CMS entry.");
        return null;
    }

    return (
        <MenuItem onClick={onClick}>
            <ListItemGraphic>
                <Icon icon={<Delete />} />
            </ListItemGraphic>
            {t`Delete`}
        </MenuItem>
    );
};
