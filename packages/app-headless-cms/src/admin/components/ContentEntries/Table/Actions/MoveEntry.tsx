import React from "react";
import { ReactComponent as Move } from "@webiny/icons/exit_to_app.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, useMoveContentEntryToFolder } from "~/admin/hooks/index.js";

export const MoveEntry = () => {
    const { entry: record } = useEntry();
    const moveContentEntry = useMoveContentEntryToFolder({ record });
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={moveContentEntry}
            data-testid={"aco.actions.entry.move"}
        />
    );
};
