import React from "react";
import { ReactComponent as Edit } from "@material-design-icons/svg/outlined/edit.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider";
import { useFile } from "~/hooks/useFile";

export const EditFile = () => {
    const { file } = useFile();
    const { showFileDetails } = useFileManagerView();
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    return (
        <OptionsMenuItem
            icon={<Edit />}
            label={"Edit"}
            onAction={() => showFileDetails(file.id)}
            data-testid={"aco.actions.file.edit"}
        />
    );
};
