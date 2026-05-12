import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFileManagerPresenter } from "../../FileList/FileManagerPresenterProvider.js";
import { useFileManagerViewConfig } from "~/presentation/config/FileManagerViewConfig.js";
import { FileProvider } from "~/presentation/contexts/FileProvider.js";
import { Content } from "~/presentation/FileDetails/components/Content.js";
import { Preview } from "~/presentation/FileDetails/components/Preview.js";
import { Actions } from "~/presentation/FileDetails/components/Actions.js";
import { Description } from "~/presentation/FileDetails/components/Description.js";

const parseWidth = (width: string) => {
    const [drawerWidth, leftPanel = "1", rightPanel = "1"] = width.split(",");
    return {
        drawerWidth,
        leftFlex: parseFloat(leftPanel),
        rightFlex: parseFloat(rightPanel)
    };
};

const FileDetailsContent = observer(function FileDetailsContent() {
    const { vm } = useFileManagerPresenter();
    const fileDetails = vm.fileDetails;
    const { fileDetails: fileDetailsConfig } = useFileManagerViewConfig();

    if (!fileDetails) {
        return null;
    }

    const { leftFlex, rightFlex } = parseWidth(fileDetailsConfig.width);

    return (
        <Content>
            <Content.Panel flex={leftFlex}>
                <div className={"flex flex-col justify-between gap-md h-full px-lg py-md"}>
                    <Actions />
                    <Preview />
                </div>
            </Content.Panel>
            <Content.Panel flex={rightFlex}>
                <div className={"p-lg"}>
                    <FormView form={fileDetails.vm.form} />
                </div>
            </Content.Panel>
        </Content>
    );
});

export const FileDetailsDrawer = observer(function FileDetailsDrawer() {
    const { vm, actions } = useFileManagerPresenter();
    const fileDetails = vm.fileDetails;
    const { fileDetails: fileDetailsConfig } = useFileManagerViewConfig();

    const { drawerWidth } = parseWidth(fileDetailsConfig.width);

    if (!fileDetails || !fileDetails.vm.file) {
        return null;
    }

    return (
        <FileProvider file={fileDetails.vm.file}>
            <Drawer
                title={fileDetails.vm.file.name ?? ""}
                description={<Description />}
                width={drawerWidth}
                open={true}
                modal={true}
                bodyPadding={false}
                headerSeparator={true}
                footerSeparator={true}
                onClose={actions.hideFileDetails}
                data-testid={"fm.file-details.drawer"}
                actions={
                    <>
                        <Drawer.CancelButton text={"Cancel"} />
                        {fileDetails.vm.permissions.canEdit && (
                            <Drawer.ConfirmButton
                                text={"Update"}
                                onClick={async () => {
                                    const saved = await fileDetails.saveFile();
                                    if (saved) {
                                        actions.hideFileDetails();
                                    }
                                }}
                            />
                        )}
                    </>
                }
            >
                {fileDetails.vm.loading && <OverlayLoader text={fileDetails.vm.loading} />}
                <FileDetailsContent />
            </Drawer>
        </FileProvider>
    );
});
