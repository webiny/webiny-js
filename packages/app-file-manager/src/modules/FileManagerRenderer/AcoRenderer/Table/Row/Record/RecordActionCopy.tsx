import React, { ReactElement } from "react";

import { ReactComponent as Copy } from "@material-design-icons/svg/outlined/content_copy.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";

import { ListItemGraphic } from "~/modules/FileManagerRenderer/AcoRenderer/Table/styled";
import { useCopyFile } from "~/modules/Hooks/useCopyFile";

import { SearchRecordItem } from "@webiny/app-aco/types";
import { FileItem } from "@webiny/app/types";

const t = i18n.ns("app-admin/file-manager/file-manager-view/actions/file/copy");

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
