import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as DownloadIcon } from "../icons/file_download.svg";
import { EXPORT_PAGE } from "./graphql";
import { useRecoilValue } from "recoil";
import { elementByIdSelector, pageAtom, rootElementAtom } from "~/editor/recoil/modules";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

const ExportPageButton: React.FunctionComponent = () => {
    const page = useRecoilValue(pageAtom);
    const rootElementId = useRecoilValue(rootElementAtom);
    const element = useRecoilValue(elementByIdSelector(rootElementId));
    const { showSnackbar } = useSnackbar();
    const [exportPage] = useMutation(EXPORT_PAGE);

    // @ts-ignore
    if (!element || !Array.isArray(element.elements) || element.elements.length === 0) {
        return null;
    }

    return (
        <MenuItem
            onClick={async () => {
                // TODO: Use translator.
                showSnackbar("We're exporting the page. Please hold on.");
                const response = await exportPage({ variables: { id: page.id } });
                const { error, data } = response.data.pageBuilder.exportPage;
                if (error) {
                    return showSnackbar(error.message);
                }
                // Download the ZIP
                window.open(data.pageZipUrl, "_blank", "noopener");
            }}
            data-testid={"pb-editor-page-options-menu-export"}
        >
            <ListItemGraphic>
                <Icon icon={<DownloadIcon />} />
            </ListItemGraphic>
            Export
        </MenuItem>
    );
};

export default ExportPageButton;
