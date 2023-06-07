import React, { useState, useMemo } from "react";
// @ts-ignore
import { useHotkeys } from "react-hotkeyz";
import omit from "lodash/omit";
import styled from "@emotion/styled";
import { FileItem } from "@webiny/app-admin/types";
import { Form, FormOnSubmit } from "@webiny/form";
import { Drawer, DrawerContent } from "@webiny/ui/Drawer";
import { CircularProgress } from "@webiny/ui/Progress";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { FileProvider } from "./FileProvider";
import { Aliases } from "./components/Aliases";
import { Name } from "./components/Name";
import { Tags } from "./components/Tags";
import { FileDetailsProvider, useFileDetails } from "~/components/FileDetails/FileDetailsProvider";
import { Preview } from "./components/Preview";
import { Actions } from "./components/Actions";
import { Header } from "./components/Header";
import { Elevation } from "@webiny/ui/Elevation";
import { Content } from "./components/Content";
import { SimpleForm } from "@webiny/app-admin/components/SimpleForm";
import { Footer } from "./components/Footer";
import { FlexRow, FlexColumn } from "./components/Flex";
import { TypeAndSize } from "~/components/FileDetails/components/TypeAndSize";
import { CreatedOn } from "./components/CreatedOn";
import { Extensions } from "./components/Extensions";
import { useFileModel } from "~/hooks/useFileModel";
import { useFileManagerAcoView } from "~/modules/FileManagerRenderer/FileManagerAcoViewProvider";
import { useSnackbar } from "@webiny/app-admin";

const FileDetailsDrawer = styled(Drawer)`
    &.mdc-drawer {
        width: 1000px;
    }
`;

const FormContainer = styled(SimpleForm)`
    margin: 0;
`;

interface FileDetailsInnerProps {
    file: FileItem;
    scope?: string;
    own?: boolean;
    onClose: () => void;
}

const FileDetailsInner: React.FC<FileDetailsInnerProps> = ({ file }) => {
    const [isLoading, setLoading] = useState(false);
    const { showSnackbar } = useSnackbar();
    const fileModel = useFileModel();
    const { updateFile } = useFileManagerAcoView();
    const { close } = useFileDetails();

    const hasExtensions = useMemo(() => {
        return fileModel.fields.find(field => field.fieldId === "extensions");
    }, [fileModel]);

    const onSubmit: FormOnSubmit<FileItem> = async ({ id, ...data }) => {
        setLoading(true);
        await updateFile(id, omit(data, ["createdBy", "createdOn", "src"]));
        setLoading(false);
        showSnackbar("File updated successfully!");
        close();
    };

    return (
        <FileProvider file={file}>
            <Form data={file} onSubmit={onSubmit}>
                {() => (
                    <DrawerContent dir="ltr">
                        {isLoading ? <CircularProgress label={"Saving file..."} /> : null}
                        <FormContainer>
                            <Header />
                            <Content>
                                <Content.Panel>
                                    <Elevation z={2} style={{ margin: 20 }}>
                                        <Actions />
                                        <Preview />
                                        <FlexRow>
                                            <FlexColumn>
                                                <TypeAndSize />
                                            </FlexColumn>
                                            <FlexColumn>
                                                <CreatedOn />
                                            </FlexColumn>
                                        </FlexRow>
                                    </Elevation>
                                </Content.Panel>
                                <Content.Panel>
                                    <Tabs>
                                        <Tab label={"Basic Details"}>
                                            <Grid>
                                                <Cell span={12}>
                                                    <Name />
                                                </Cell>
                                                <Cell span={12}>
                                                    <Tags />
                                                </Cell>
                                                <Cell span={12}>
                                                    <Aliases />
                                                </Cell>
                                            </Grid>
                                        </Tab>
                                        {hasExtensions ? (
                                            <Tab label={"Advanced Details"}>
                                                <Extensions model={fileModel} />
                                            </Tab>
                                        ) : null}
                                    </Tabs>
                                </Content.Panel>
                            </Content>
                            <Footer />
                        </FormContainer>
                    </DrawerContent>
                )}
            </Form>
        </FileProvider>
    );
};

export interface FileDetailsProps {
    file?: FileItem;
    open: boolean;
    loading: boolean;
    scope?: string;
    own?: boolean;
    onClose: () => void;
}

export const FileDetails: React.FC<FileDetailsProps> = ({
    open,
    onClose,
    loading,
    file,
    ...rest
}) => {
    useHotkeys({
        zIndex: 55,
        disabled: !open,
        keys: {
            esc: onClose
        }
    });

    return (
        <FileDetailsDrawer
            dir="rtl"
            modal
            open={open}
            onClose={onClose}
            data-testid={"fm.file-details.drawer"}
        >
            <DrawerContent dir="ltr">
                {loading && <CircularProgress label={"Loading file details..."} />}
                {file && (
                    <FileDetailsProvider
                        hideFileDetails={onClose}
                        scope={rest.scope}
                        own={rest.own}
                    >
                        <FileDetailsInner file={file} onClose={onClose} {...rest} />
                    </FileDetailsProvider>
                )}
            </DrawerContent>
        </FileDetailsDrawer>
    );
};

export { useFile } from "./FileProvider";
export { useFileDetails } from "./FileDetailsProvider";
