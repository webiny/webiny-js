import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/folder/edit");

interface Props {
    onClick: () => void;
}
export const FolderActionEdit = ({ onClick }: Props): ReactElement => {
    return <MenuItem onClick={onClick}>{t`Edit`}</MenuItem>;
};
