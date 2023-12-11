import React, { useMemo, useState } from "react";
// @ts-expect-error
import { useHotkeys } from "react-hotkeyz";
import omit from "lodash/omit";
import styled from "@emotion/styled";
import { FileItem } from "@webiny/app-admin/types";
import { Form, FormOnSubmit } from "@webiny/form";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { FileDetailsProvider } from "~/components/FileDetails/FileDetailsProvider";
import { Preview } from "./components/Preview";
import { PreviewMeta } from "./components/PreviewMeta";
import { Actions } from "./components/Actions";
import { Header } from "./components/Header";
import { Elevation } from "@webiny/ui/Elevation";
import { Content } from "./components/Content";
import { SimpleForm } from "@webiny/app-admin/components/SimpleForm";
import { Footer } from "./components/Footer";
import { Extensions } from "./components/Extensions";
import { useFileModel } from "~/hooks/useFileModel";
import { useFileManagerView, useFileManagerViewConfig } from "~/index";
import { useSnackbar } from "@webiny/app-admin";
import { useFileDetails } from "~/hooks/useFileDetails";
import { FileProvider } from "~/contexts/FileProvider";
import { prepareFormData } from "@webiny/app-headless-cms-common";
import { CmsModelField } from "@webiny/app-headless-cms/types";

type FileDetailsDrawerProps = React.ComponentProps<typeof Drawer> & { width: string };

const FileDetailsDrawer = styled(Drawer)<FileDetailsDrawerProps>`
    z-index: 70;
    &.mdc-drawer {
        width: ${props => props.width};
    }
    & + .mdc-drawer-scrim {
        z-index: 65;
    }
`;

const FormContainer = styled(SimpleForm)`
    margin: 0;
    /* Fix for the dir=rtl when a form is inside a drawer placed on the right side */
    .mdc-floating-label {
        transform-origin: left top !important;
        left: 16px !important;
        right: initial !important;
    }
`;

interface FileDetailsInnerProps {
    file: FileItem;
    onClose: () => void;
}

const prepareFileData = (data: Record<string, any>, fields: CmsModelField[]) => {
    const output = omit(data, ["createdBy", "createdOn", "src"]);
    if (fields.length === 0) {
        return output;
    }

    return {
        ...output,
        extensions: prepareFormData(output.extensions || {}, fields)
    };
};

const FileDetailsInner: React.FC<FileDetailsInnerProps> = ({ file }) => {
    const [isLoading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const fileModel = useFileModel();
    const { updateFile } = useFileManagerView();
    const { close } = useFileDetails();
    const { fileDetails } = useFileManagerViewConfig();

    const [, leftPanel = "1", rightPanel = "1"] = fileDetails.width.split(",");

    const extensionFields = useMemo(() => {
        const fields = fileModel.fields.find(field => field.fieldId === "extensions");
        if (!fields?.settings?.fields) {
            return [];
        }
        return fields?.settings?.fields || [];
    }, [fileModel]);

    const onSubmit: FormOnSubmit<FileItem> = async ({ id, ...data }) => {
        setLoading(true);
        const fileData = prepareFileData(data, extensionFields);
        await updateFile(id, fileData);
        setLoading(false);
        showSnackbar("File updated successfully!");
        close();
    };

    const basicFieldsElement = (
        <Grid>
            {fileDetails.fields.map(field => (
                <Cell span={12} key={field.name}>
                    {field.element}
                </Cell>
            ))}
        </Grid>
    );

    const extensionFieldsElement =
        extensionFields.length > 0 ? <Extensions model={fileModel} /> : null;

    return (
        <Form data={file} onSubmit={onSubmit}>
            {() => (
                <DrawerContent dir="ltr">
                    {isLoading ? <CircularProgress label={"Saving file..."} /> : null}
                    <FormContainer>
                        <Header />
                        <Content>
                            <Content.Panel flex={parseFloat(leftPanel)}>
                                <Elevation z={2} style={{ margin: 20 }}>
                                    <Actions />
                                    <Preview />
                                    <PreviewMeta />
                                </Elevation>
                            </Content.Panel>
                            <Content.Panel flex={parseFloat(rightPanel)}>
                                {fileDetails.groupFields ? (
                                    <Tabs>
                                        <Tab label={"Basic Details"}>{basicFieldsElement}</Tab>
                                        <Tab label={"Advanced Details"}>
                                            {extensionFieldsElement}
                                        </Tab>
                                    </Tabs>
                                ) : (
                                    <>
                                        {basicFieldsElement}
                                        {extensionFieldsElement}
                                    </>
                                )}
                            </Content.Panel>
                        </Content>
                        <Footer />
                    </FormContainer>
                </DrawerContent>
            )}
        </Form>
    );
};

export interface FileDetailsProps {
    file?: FileItem;
    open: boolean;
    loading: boolean;
    onClose: () => void;
}

export const FileDetails: React.FC<FileDetailsProps> = ({ open, onClose, loading, file }) => {
    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    const { fileDetails } = useFileManagerViewConfig();

    const drawerWidth = fileDetails.width.split(",")[0];

    return (
        <FileDetailsDrawer
            width={drawerWidth}
            dir="rtl"
            modal
            open={open}
            onClose={onClose}
            data-testid={"fm.file-details.drawer"}
        >
            <DrawerContent dir="ltr">
                {loading && <CircularProgress label={"Loading file details..."} />}
                {file && (
                    <FileProvider file={file}>
                        <FileDetailsProvider hideFileDetails={onClose}>
                            <FileDetailsInner file={file} onClose={onClose} />
                        </FileDetailsProvider>
                    </FileProvider>
                )}
            </DrawerContent>
        </FileDetailsDrawer>
    );
};
