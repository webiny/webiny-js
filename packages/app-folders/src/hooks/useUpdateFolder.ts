import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import get from "lodash/get";

import { UPDATE_FOLDER } from "~/graphql/folders.gql";

import { UpdateFolderResponse, UpdateFolderVariables } from "~/types";

interface UseUpdateFolder {
    update: Function;
    loading: boolean;
}

export const useUpdateFolder = (): UseUpdateFolder => {
    const { showSnackbar } = useSnackbar();

    const [update, { loading }] = useMutation<UpdateFolderResponse, UpdateFolderVariables>(
        UPDATE_FOLDER,
        {
            onCompleted: response => {
                const error = get(response, "folders.updateFolder.error");
                if (error) {
                    showSnackbar(error.message);
                    return;
                }
                showSnackbar("Folder updated successfully!");
            }
        }
    );

    return {
        update,
        loading
    };
};
