import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useEntry, useMoveContentEntryToFolder } from "~/admin/hooks";

export const MoveEntry = () => {
    const { entry: record } = useEntry();
    const moveContentEntry = useMoveContentEntryToFolder({ record });
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.EntryAction;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveContentEntry}
            data-testid={"aco.actions.entry.move"}
        />
    );
};
