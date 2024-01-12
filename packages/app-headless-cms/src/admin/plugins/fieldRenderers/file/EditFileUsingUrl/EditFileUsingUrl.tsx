import React from "react";
import { observer } from "mobx-react-lite";
import { FileManagerProvider } from "@webiny/app-file-manager/modules/FileManagerRenderer/FileManagerView";
import { FileDetails } from "@webiny/app-file-manager/components/FileDetails";

interface EditFileRenderProp {
    editFile: (url: string) => void;
}

interface EditFileUsingUrlProps {
    children: (params: EditFileRenderProp) => React.ReactNode;
}

export const EditFileUsingUrl = observer(({ children }: EditFileUsingUrlProps) => {
    const presenter = useMemo(() => new EditFileUsingUrlPresenter(), []);

    const renderPropParams = useMemo(() => {
        return { editFile: presenter.loadFileFromUrl };
    }, [presenter]);

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
