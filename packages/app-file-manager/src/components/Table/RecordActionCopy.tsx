import React, { ReactElement } from "react";

import { ReactComponent as Copy } from "@material-design-icons/svg/outlined/content_copy.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { useCopyFile } from "~/modules/Hooks/useCopyFile";

import { SearchRecordItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";

import { ListItemGraphic } from "./styled";

const t = i18n.ns("app-admin/file-manager/components/table/record-action-copy");

interface RecordActionCopyProps {
    record: SearchRecordItem<FileItem>["data"];
}
export const RecordActionCopy = ({ record }: RecordActionCopyProps): ReactElement => {
    const { copyFileUrl } = useCopyFile({ file: record });
    return (
        <MenuItem onClick={copyFileUrl}>
            <ListItemGraphic>
                <Icon icon={<Copy />} />
            </ListItemGraphic>
            {t`Copy`}
        </MenuItem>
    );
};