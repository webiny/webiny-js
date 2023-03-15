import React from "react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { useSnackbar } from "~/hooks/useSnackbar";
import { useMutation } from "@apollo/react-hooks";
import { i18n } from "@webiny/app/i18n";
import { FileManagerFileItem } from "~/components/FileManager";
const t = i18n.ns("app-admin/file-manager/files/delete-action");

import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { DELETE_FILE } from "~/components/FileManager/graphql";

interface DeleteActionProps {
    file: FileManagerFileItem;
}
const DeleteAction: React.FC<DeleteActionProps> = props => {
    const { file } = props;
    const { showSnackbar } = useSnackbar();
    const [deleteFile] = useMutation(DELETE_FILE, {
        variables: {
            id: file.id
        }
    });

    return (
        <>
            <Tooltip content={<span>Edit image</span>} placement={"bottom"}>
                <IconButton
                    icon={<DeleteIcon style={{ margin: "0 8px 0 0" }} />}
                    onClick={async () => {
                        await deleteFile();
                        showSnackbar(t`File deleted.`);
                    }}
                />
            </Tooltip>
        </>
    );
};

export default DeleteAction;
