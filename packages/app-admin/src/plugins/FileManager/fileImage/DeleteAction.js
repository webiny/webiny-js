// @flow
import React from "react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ReactComponent as DeleteIcon } from "../../../components/FileManager/icons/delete.svg";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-admin/file-manager/files/delete-action");

const DELETE_FILE = gql`
    mutation deleteFile($id: ID!) {
        files {
            deleteFile(id: $id) {
                data
            }
        }
    }
`;

const DeleteAction = (props: Object) => {
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
