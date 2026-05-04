import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Drawer } from "@webiny/admin-ui";
import { OverlayLoader } from "@webiny/admin-ui";
import { Tabs } from "@webiny/admin-ui";
import { Grid } from "@webiny/admin-ui";
import { FormView } from "@webiny/app-admin/features/formModel/FormView.js";
import { useFileDetailsPresenter } from "../FileDetailsPresenterProvider.js";
import { useFileManagerViewConfig } from "~/modules/FileManagerRenderer/FileManagerView/FileManagerViewConfig.js";
import { FileProvider } from "~/contexts/FileProvider.js";
import { Content } from "~/components/FileDetails/components/Content.js";
import { Preview } from "~/components/FileDetails/components/Preview.js";
import { Actions } from "~/components/FileDetails/components/Actions.js";
import { Description } from "~/components/FileDetails/components/Description.js";
import { Extensions } from "~/components/FileDetails/components/Extensions.js";
import { useFileModel } from "~/hooks/useFileModel.js";
import type { FileItem } from "~/types.js";
import type { FmFile } from "~/features/shared/types.js";

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
 * Adapt FmFile from the presenter vm to the legacy FileItem shape
 * expected by FileProvider and existing action components.
 */
const toFileItem = (file: FmFile): FileItem => {
    return {
        id: file.id,
        name: file.name ?? "",
        key: file.key ?? "",
        src: file.src ?? "",
        size: file.size ?? 0,
        type: file.type ?? "",
        tags: file.tags ?? [],
        createdOn:
            typeof file.createdOn === "string" ? file.createdOn : file.createdOn.toISOString(),
        createdBy: {
            id: file.createdBy?.id ?? "",
            displayName: file.createdBy?.displayName ?? ""
        },
        savedOn: typeof file.savedOn === "string" ? file.savedOn : file.savedOn.toISOString(),
        savedBy: {
            id: (file as any).savedBy?.id ?? "",
            displayName: (file as any).savedBy?.displayName ?? ""
        },
        modifiedOn: (file as any).modifiedOn
            ? typeof (file as any).modifiedOn === "string"
                ? (file as any).modifiedOn
                : (file as any).modifiedOn.toISOString()
            : "",
        modifiedBy: {
            id: (file as any).modifiedBy?.id ?? "",
            displayName: (file as any).modifiedBy?.displayName ?? ""
        },
        location: file.location ?? { folderId: "" },
        metadata: file.metadata,
        accessControl: file.accessControl,
        extensions: (file as any).extensions
    } as FileItem;
};

interface FileDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Inner content of the file details drawer.
 * Renders the two-panel layout: left (actions + preview), right (form fields).
 */
const FileDetailsContent = observer(function FileDetailsContent() {
    const presenter = useFileDetailsPresenter();
    const { fileDetails } = useFileManagerViewConfig();
    const fileModel = useFileModel();
    const { vm } = presenter;

    const { leftFlex, rightFlex } = parseWidth(fileDetails.width);

    const extensionFields = useMemo(() => {
        const fields = fileModel.fields.find(field => field.fieldId === "extensions");
        if (!fields?.settings?.fields) {
            return [];
        }
        return fields.settings.fields;
    }, [fileModel]);

    // Basic fields from the FormView (driven by presenter vm.form).
    const basicFieldsElement = (
        <div className={"p-lg"}>
            <FormView form={vm.form} />
        </div>
    );

    // ConfigAPI-registered fields.
    const configFieldsElement =
        fileDetails.fields.length > 0 ? (
            <Grid>
                {fileDetails.fields.map(field => (
                    <Grid.Column span={12} key={field.name}>
                        {field.element}
                    </Grid.Column>
                ))}
            </Grid>
        ) : null;

    // Extension fields from the CMS model.
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
                {fileDetails.groupFields ? (
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
                        <FormView form={vm.form} />
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
 * File Details drawer component driven by the FileDetailsPresenter.
 * Uses observer() to reactively render from the presenter's vm.
 */
export const FileDetailsDrawer = observer(function FileDetailsDrawer({
    open,
    onClose
}: FileDetailsDrawerProps) {
    const presenter = useFileDetailsPresenter();
    const { fileDetails } = useFileManagerViewConfig();
    const { vm } = presenter;

    const { drawerWidth } = parseWidth(fileDetails.width);

    // Adapt FmFile to FileItem for the FileProvider context.
    const fileItem = useMemo(() => {
        if (!vm.file) {
            return null;
        }
        return toFileItem(vm.file);
    }, [vm.file]);

    if (!vm.file || !fileItem) {
        return null;
    }

    return (
        <FileProvider file={fileItem}>
            <Drawer
                title={vm.file.name ?? ""}
                description={<Description />}
                width={drawerWidth}
                open={open}
                modal={true}
                bodyPadding={false}
                headerSeparator={true}
                footerSeparator={true}
                onClose={onClose}
                data-testid={"fm.file-details.drawer"}
                actions={
                    <>
                        <Drawer.CancelButton text={"Cancel"} />
                        {vm.permissions.canEdit && (
                            <Drawer.ConfirmButton
                                text={"Update"}
                                onClick={() => presenter.saveFile()}
                            />
                        )}
                    </>
                }
            >
                {vm.loading && <OverlayLoader />}
                <FileDetailsContent />
            </Drawer>
        </FileProvider>
    );
});
