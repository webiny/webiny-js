import { useApolloClient } from "@apollo/react-hooks";
import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import noop from "lodash/noop";
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

interface EditFileRenderProp {
    editFile: (url: string) => void;
}

interface EditFileUsingUrlProps {
    onUpdate?: (file: FileItem) => void;
    onSetFile?: (file: FileItem) => void;
    children: (params: EditFileRenderProp) => React.ReactNode;
}

export const EditFileUsingUrl = observer(
    ({ children, onSetFile = noop, onUpdate = noop }: EditFileUsingUrlProps) => {
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
            <>
                <FileManagerProvider>
                    <FileDetails
                        onSetFile={onSetFile}
                        loading={vm.loadingMessage}
                        file={vm.file}
                        onClose={presenter.closeDrawer}
                        open={vm.isOpened}
                        onSave={onSave}
                    />
                    {children(renderPropParams)}
                </FileManagerProvider>
            </>
        );
    }
);

EditFileUsingUrl.displayName = "EditFileUsingUrl";
