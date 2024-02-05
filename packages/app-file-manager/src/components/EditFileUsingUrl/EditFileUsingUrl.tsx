import { useApolloClient } from "@apollo/react-hooks";
import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useSnackbar } from "@webiny/app-admin";
import { FileItem } from "@webiny/app-admin/types";
import { FileManagerProvider } from "~/modules/FileManagerRenderer/FileManagerView";
import { FileDetails } from "~/components/FileDetails";
import { EditFileUsingUrlPresenter } from "./EditFileUsingUrlPresenter";
import { EditFileUsingUrlRepository } from "./EditFileUsingUrlRepository";
import { GetFileByUrl } from "./GetFileByUrl";
import { UpdateFile } from "./UpdateFile";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext";
import { useFileModel } from "~/hooks/useFileModel";
import { FileDetailsActions } from "~/components/FileDetails/components/Actions";

interface EditFileRenderProp {
    editFile: (url: string) => void;
}

interface EditFileUsingUrlProps {
    onUpdate?: (file: FileItem) => void;
    actions?: Partial<FileDetailsActions>;
    children: (params: EditFileRenderProp) => React.ReactNode;
}

const voidOnUpdate = () => {
    // Do nothing.
};

export const EditFileUsingUrl = observer(
    ({ actions, children, onUpdate = voidOnUpdate }: EditFileUsingUrlProps) => {
        const client = useApolloClient();
        const { showSnackbar } = useSnackbar();
        const fileManagerApi = useFileManagerApi();
        const fileModel = useFileModel();
        const repository = useMemo(
            () =>
                new EditFileUsingUrlRepository(
                    new GetFileByUrl(client, fileModel),
                    new UpdateFile(fileManagerApi)
                ),
            []
        );
        const presenter = useMemo(() => new EditFileUsingUrlPresenter(repository), []);

        const vm = presenter.vm;

        const renderPropParams = useMemo(() => {
            return { editFile: presenter.loadFileFromUrl };
        }, [presenter]);

        const onSave = useCallback(
            async (file: FileItem) => {
                await presenter.updateFile(file);
                onUpdate(file);
            },
            [onUpdate]
        );

        useEffect(() => {
            if (vm.errorMessage) {
                showSnackbar(vm.errorMessage);
            }
        }, [vm.errorMessage]);

        return (
            <FileManagerProvider>
                <FileDetails
                    loading={vm.loadingMessage}
                    file={vm.file}
                    onClose={presenter.closeDrawer}
                    open={vm.isOpened}
                    onSave={onSave}
                    actions={{ delete: false, ...actions }}
                />
                {children(renderPropParams)}
            </FileManagerProvider>
        );
    }
);

EditFileUsingUrl.displayName = "EditFileUsingUrl";
