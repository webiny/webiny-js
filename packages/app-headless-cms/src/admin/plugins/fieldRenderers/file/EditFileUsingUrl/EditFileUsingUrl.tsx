import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { FileManagerProvider } from "@webiny/app-file-manager/modules/FileManagerRenderer/FileManagerView";
import { FileDetails } from "@webiny/app-file-manager/components/FileDetails";
import { EditFileUsingUrlPresenter } from "./EditFileUsingUrlPresenter";
import { EditFileUsingUrlRepository } from "./EditFileUsingUrlRepository";

interface EditFileRenderProp {
    editFile: (url: string) => void;
}

interface EditFileUsingUrlProps {
    children: (params: EditFileRenderProp) => React.ReactNode;
}

const repository = new EditFileUsingUrlRepository();

export const EditFileUsingUrl = observer(({ children }: EditFileUsingUrlProps) => {
    const presenter = useMemo(() => new EditFileUsingUrlPresenter(repository), []);

    const renderPropParams = useMemo(() => {
        return { editFile: presenter.loadFileFromUrl };
    }, [presenter]);

    const vm = presenter.vm;

    return (
        <FileManagerProvider>
            <FileDetails
                loading={vm.loading}
                file={vm.file}
                onClose={presenter.closeDrawer}
                open={vm.isOpened}
            />
            {children(renderPropParams)}
        </FileManagerProvider>
    );
});

EditFileUsingUrl.displayName = "EditFileUsingUrl";
