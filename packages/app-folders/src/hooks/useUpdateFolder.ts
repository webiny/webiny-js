import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash/get";

import { UPDATE_FOLDER } from "~/graphql/folders.gql";

import { UpdateFolderResponse, UpdateFolderVariables } from "~/types";
import { i18n } from "@webiny/app/i18n";

interface UseUpdateFolder {
    updateFolder: Function;
    loading: boolean;
}

const t = i18n.ns("app-folders/hooks/use-update-folder");

export const useUpdateFolder = (): UseUpdateFolder => {
    const { showSnackbar } = useSnackbar();

    const [updateFolder, { loading }] = useMutation<UpdateFolderResponse, UpdateFolderVariables>(
        UPDATE_FOLDER,
        {
            onCompleted: response => {
                const error = get(response, "folders.updateFolder.error");
                if (error) {
                    return showSnackbar(error.message);
                }
                showSnackbar(t("Folder updated successfully!"));
            }
        }
    );

    return {
        updateFolder,
        loading
    };
};
