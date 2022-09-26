import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash/get";

import { CREATE_FOLDER } from "~/graphql/folders.gql";

import { CreateFolderResponse, CreateFolderVariables } from "~/types";

interface UseUpdateFolder {
    create: Function;
    loading: boolean;
}

export const useCreateFolder = (): UseUpdateFolder => {
    const { showSnackbar } = useSnackbar();

    const [create, { loading }] = useMutation<CreateFolderResponse, CreateFolderVariables>(
        CREATE_FOLDER,
        {
            onCompleted: response => {
                const error = get(response, "folders.createFolder.error");
                if (error) {
                    showSnackbar(error.message);
                    return;
                }
                showSnackbar("Folder created successfully!");
            }
        }
    );

    return {
        create,
        loading
    };
};
