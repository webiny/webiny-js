import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";

import { CREATE_FOLDER } from "~/graphql/folders.gql";

import { CreateFolderResponse, CreateFolderVariables } from "~/types";
import { useListFolders } from "~/hooks/useListFolders";

interface UseCreateFolder {
    createFolder: Function;
    loading: boolean;
}

const t = i18n.ns("app-folders/hooks/use-create-folder");

export const useCreateFolder = (): UseCreateFolder => {
    const { showSnackbar } = useSnackbar();
    const { refetchFolders } = useListFolders();

    const [createFolder, { loading }] = useMutation<CreateFolderResponse, CreateFolderVariables>(
        CREATE_FOLDER,
        {
            onCompleted: response => {
                const error = get(response, "folders.createFolder.error");
                if (error) {
                    return showSnackbar(error.message);
                }

                refetchFolders();
                showSnackbar(t("Folder created successfully!"));
            }
        }
    );

    return {
        createFolder,
        loading
    };
};
