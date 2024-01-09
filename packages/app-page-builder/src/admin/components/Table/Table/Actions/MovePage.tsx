import React from "react";
import { ReactComponent as Move } from "@material-design-icons/svg/outlined/drive_file_move.svg";
import { AcoConfig } from "@webiny/app-aco";
import { usePage } from "~/admin/views/Pages/hooks/usePage";
import { useMovePageToFolder } from "~/admin/views/Pages/hooks/useMovePageToFolder";

export const MovePage = () => {
    const { page } = usePage();
    const movePageToFolder = useMovePageToFolder({ record: page });
    const { OptionsMenuItem } = AcoConfig.Record.Action;

    return (
        <OptionsMenuItem
            icon={<Move />}
            label={"Move"}
            onAction={movePageToFolder}
            data-testid={"aco.actions.pb.page.move"}
        />
    );
};
