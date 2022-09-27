import { useMutation } from "@apollo/react-hooks";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";

import { CREATE_FOLDER } from "~/graphql/folders.gql";

import { CreateFolderResponse, CreateFolderVariables } from "~/types";

interface UseUpdateFolder {
    create: Function;
    loading: boolean;
}

const t = i18n.ns("app-folders/hooks/use-create-folder");

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
                showSnackbar(t("Folder created successfully!"));
            }
        }
    );

    return {
        create,
        loading
    };
};
