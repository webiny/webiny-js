import { useApolloClient } from "@apollo/client/react";
import React, { useCallback, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import noop from "lodash/noop.js";
import { useSnackbar } from "@webiny/app-admin";
import type { FileItem } from "~/types.js";
import { FileManagerProvider } from "~/modules/FileManagerRenderer/FileManagerView/index.js";
import { FileDetails } from "~/components/FileDetails/index.js";
import { EditFileUsingUrlPresenter } from "./EditFileUsingUrlPresenter.js";
import { EditFileUsingUrlRepository } from "./EditFileUsingUrlRepository.js";
import { GetFileByUrl } from "./GetFileByUrl.js";
import { UpdateFile } from "./UpdateFile.js";
import { useFileManagerApi } from "~/modules/FileManagerApiProvider/FileManagerApiContext/index.js";
import { useFileModel } from "~/hooks/useFileModel.js";

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
