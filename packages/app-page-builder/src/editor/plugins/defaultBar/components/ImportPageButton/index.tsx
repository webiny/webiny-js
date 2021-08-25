import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as UploadIcon } from "../icons/file_upload.svg";
import { IMPORT_PAGE } from "./graphql";
import { useRecoilValue } from "recoil";
import { elementByIdSelector, pageAtom, rootElementAtom } from "~/editor/recoil/modules";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { FileManager } from "@webiny/app-admin/components";

const ImportPageButton: React.FunctionComponent = () => {
    const page = useRecoilValue(pageAtom);
    const rootElementId = useRecoilValue(rootElementAtom);
    const element = useRecoilValue(elementByIdSelector(rootElementId));
    const { showSnackbar } = useSnackbar();
    const [importPage] = useMutation(IMPORT_PAGE);

    // @ts-ignore
    if (!element || !Array.isArray(element.elements) || element.elements.length !== 0) {
        return null;
    }

    return (
        <FileManager
            onUploadCompletion={async uploadedFiles => {
                console.log("File uploaded successfully. Now move on!");

                const response = await importPage({
                    variables: {
                        id: page.id,
                        data: {
                            zipFileKey: uploadedFiles[0].key
                        }
                    }
                });

                if (response.errors) {
                    showSnackbar("Something went wrong.");
                }
                // TODO: Handle it more gracefully.
                window.location.reload();
            }}
            // TODO: Implement custom extension "wpbx" Webiny Page Builder export
            accept={["zip", "application/zip", "application/x-zip", "application/x-zip-compressed"]}
        >
            {({ showFileManager }) => (
                <MenuItem
                    onClick={async () => {
                        showFileManager();
                    }}
                    data-testid={"pb-editor-page-options-menu-export"}
                >
                    <ListItemGraphic>
                        <Icon icon={<UploadIcon />} />
                    </ListItemGraphic>
                    Import
                </MenuItem>
            )}
        </FileManager>
    );
};

export default ImportPageButton;
