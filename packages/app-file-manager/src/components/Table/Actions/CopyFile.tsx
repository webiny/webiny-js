import React from "react";
import { ReactComponent as Copy } from "@material-design-icons/svg/outlined/content_copy.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useCopyFile } from "~/hooks/useCopyFile";
import { useFile } from "~/hooks/useFile";

export const CopyFile = () => {
    const { file } = useFile();
    const { copyFileUrl } = useCopyFile({ file });
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    return (
        <OptionsMenuItem
            icon={<Copy />}
            label={"Copy"}
            onAction={copyFileUrl}
            data-testid={"aco.actions.file.copy"}
        />
    );
};
