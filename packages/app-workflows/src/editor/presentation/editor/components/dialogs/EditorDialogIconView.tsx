import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as DeleteForeverIcon } from "@webiny/icons/delete_forever.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as SwapHorizIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as SyncProblemIcon } from "@webiny/icons/sync_problem.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { EditorDialogIcon } from "~/editor/presentation/editor/EditorDialogIcon.js";

const ICONS: Record<EditorDialogIcon, React.ReactElement> = {
    warning: <WarningIcon />,
    delete: <DeleteIcon />,
    delete_forever: <DeleteForeverIcon />,
    sync_problem: <SyncProblemIcon />,
    block: <BlockIcon />,
    refresh: <RefreshIcon />,
    swap_horiz: <SwapHorizIcon />
};

export interface EditorDialogIconViewProps {
    name: EditorDialogIcon;
}

// The dialog header clones this element to size it; it inherits its colour (see "Design deviates").
export const EditorDialogIconView = ({ name }: EditorDialogIconViewProps) => {
    return <Icon icon={ICONS[name]} label={""} data-dialog-icon={name} />;
};
