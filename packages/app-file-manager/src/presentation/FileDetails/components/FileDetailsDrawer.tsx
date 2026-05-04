import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { Tabs } from "@webiny/admin-ui";
import { Grid } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFileManagerPresenter } from "../../FileList/FileManagerPresenterProvider.js";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { FileProvider } from "~/contexts/FileProvider.js";
import { Content } from "~/components/FileDetails/components/Content.js";
import { Preview } from "~/components/FileDetails/components/Preview.js";
import { Actions } from "~/components/FileDetails/components/Actions.js";
import { Description } from "~/components/FileDetails/components/Description.js";
import { Extensions } from "~/components/FileDetails/components/Extensions.js";
import { useFileModel } from "~/hooks/useFileModel.js";

/**
 * Parse the fileDetails.width config string.
 * Format: "drawerWidth,leftPanelFlex,rightPanelFlex".
 */
const parseWidth = (width: string) => {
    const [drawerWidth, leftPanel = "1", rightPanel = "1"] = width.split(",");
    return {
        drawerWidth,
        leftFlex: parseFloat(leftPanel),
        rightFlex: parseFloat(rightPanel)
    };
};

/**
 * Inner content of the file details drawer.
 * Renders the two-panel layout: left (actions + preview), right (form fields).
 */
const FileDetailsContent = observer(function FileDetailsContent() {
    const { vm } = useFileManagerPresenter();
    const fileDetails = vm.fileDetails;
    const { fileDetails: fileDetailsConfig } = useFileManagerViewConfig();
    const fileModel = useFileModel();

    if (!fileDetails) {
        return null;
    }

    const { leftFlex, rightFlex } = parseWidth(fileDetailsConfig.width);

    const extensionFields = useMemo(() => {
        const fields = fileModel.fields.find(field => field.fieldId === "extensions");
        if (!fields?.settings?.fields) {
            return [];
        }
        return fields.settings.fields;
    }, [fileModel]);

    const basicFieldsElement = (
        <div className={"p-lg"}>
            <FormView form={fileDetails.vm.form} />
        </div>
    );

    const configFieldsElement =
        fileDetailsConfig.fields.length > 0 ? (
            <Grid>
                {fileDetailsConfig.fields.map(field => (
                    <Grid.Column span={12} key={field.name}>
                        {field.element}
                    </Grid.Column>
                ))}
            </Grid>
        ) : null;

    const extensionFieldsElement =
        extensionFields.length > 0 ? <Extensions model={fileModel} /> : null;

    return (
        <Content>
            <Content.Panel flex={leftFlex}>
                <div className={"flex flex-col justify-between gap-md h-full px-lg py-md"}>
                    <Actions />
                    <Preview />
                </div>
            </Content.Panel>
            <Content.Panel flex={rightFlex}>
                {fileDetailsConfig.groupFields ? (
                    <Tabs
                        size={"md"}
                        spacing={"lg"}
                        separator={true}
                        tabs={[
                            <Tabs.Tab
                                key={"basic-details"}
                                value={"basic-details"}
                                trigger={"Basic details"}
                                content={
                                    <>
                                        {basicFieldsElement}
                                        {configFieldsElement}
                                    </>
                                }
                            />,
                            <Tabs.Tab
                                key={"advanced-details"}
                                value={"advanced-details"}
                                trigger={"Advanced details"}
                                content={extensionFieldsElement}
                            />
                        ]}
                    />
                ) : (
                    <div className={"p-lg"}>
                        <FormView form={fileDetails.vm.form} />
                        {configFieldsElement && (
                            <div className={"mt-lg"}>{configFieldsElement}</div>
                        )}
                        {extensionFieldsElement && (
                            <div className={"mt-lg"}>{extensionFieldsElement}</div>
                        )}
                    </div>
                )}
            </Content.Panel>
        </Content>
    );
});

/**
 * File Details drawer component driven by the FileManagerPresenter.
 * Open when vm.fileDetails is non-null, closed otherwise.
 */
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
                                onClick={() => fileDetails.saveFile()}
                            />
                        )}
                    </>
                }
            >
                {fileDetails.vm.loading && <OverlayLoader />}
                <FileDetailsContent />
            </Drawer>
        </FileProvider>
    );
});
