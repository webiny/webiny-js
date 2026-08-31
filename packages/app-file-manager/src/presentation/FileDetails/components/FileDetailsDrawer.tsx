import React from "react";
import { observer } from "mobx-react-lite";
import { Drawer, Separator } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFileManagerPresenter } from "~/presentation/FileList/index.js";
import { useFileManagerConfig } from "~/presentation/config/FileManagerViewConfig.js";
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
    const { fileDetails: fileDetailsConfig } = useFileManagerConfig();

    if (!fileDetails) {
        return null;
    }

    const { leftFlex, rightFlex } = parseWidth(fileDetailsConfig.width);

    return (
        <div className={"flex flex-col h-full"}>
            {/*
             * The actions row spans the whole drawer, ABOVE the two panels. Inside the left panel it
             * was bounded by that panel's width, so the last action's label was clipped as soon as
             * the row outgrew half the drawer — adding one action broke the one before it.
             *
             * The Separator is load-bearing, not decoration: the panels' vertical divider starts
             * where they start, so without a horizontal rule for it to meet, its top end just hangs
             * in the middle of the drawer. Same toolbar-then-Separator structure as ListViewHeader.
             */}
            <div className={"px-lg py-sm"}>
                <Actions />
            </div>
            <Separator />
            <Content className={"flex-1"}>
                <Content.Panel flex={leftFlex}>
                    <div className={"h-full p-lg"}>
                        <Preview />
                    </div>
                </Content.Panel>
                <Content.Panel flex={rightFlex}>
                    <div className={"p-lg"}>
                        <FormView name="File Details" form={fileDetails.vm.form} />
                    </div>
                </Content.Panel>
            </Content>
        </div>
    );
});

export const FileDetailsDrawer = observer(function FileDetailsDrawer() {
    const { vm, actions } = useFileManagerPresenter();
    const fileDetails = vm.fileDetails;
    const { fileDetails: fileDetailsConfig } = useFileManagerConfig();

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
                                // Enabled only when there is something to save, so the button itself
                                // shows whether the drawer holds unsaved changes. Nothing else on
                                // screen does — which is why an applied AI suggestion looked saved.
                                disabled={!fileDetails.vm.form.isDirty}
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
