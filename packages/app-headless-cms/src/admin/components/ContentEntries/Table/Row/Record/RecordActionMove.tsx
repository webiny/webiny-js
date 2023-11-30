import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { useMoveContentEntryToFolder } from "~/admin/views/contentEntries/hooks";
import { EntryTableItem } from "~/types";

const t = i18n.ns("app-headless-cms/admin/components/content-entries/table");

interface Props {
    record: EntryTableItem;
}
export const RecordActionMove: React.VFC<Props> = ({ record }) => {
    const moveContentEntry = useMoveContentEntryToFolder({ record });

    return (
        <MenuItem onClick={moveContentEntry}>
            <ListItemGraphic>
                <Icon icon={<Move />} />
            </ListItemGraphic>
            {t`Move`}
        </MenuItem>
    );
};
