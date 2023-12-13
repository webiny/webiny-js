import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { AcoConfig } from "@webiny/app-aco";
import { useEntry, useMoveContentEntryToFolder } from "~/admin/hooks";

export const MoveEntry = () => {
    const { entry: record } = useEntry();
    const moveContentEntry = useMoveContentEntryToFolder({ record });
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveContentEntry}
            data-testid={"aco.actions.entry.move"}
        />
    );
};
