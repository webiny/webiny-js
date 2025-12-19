import React from "react";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { Empty, FilterList } from "./components/index.js";

type filterCallback = (filterId: string) => void;

interface QueryManagerDialogProps {
    onClose: () => void;
    onCreate: () => void;
    onEdit: filterCallback;
    onRename: filterCallback;
    onClone: filterCallback;
    onDelete: filterCallback;
    onSelect: filterCallback;
    vm: {
        isOpen: boolean;
        isLoading: boolean;
        view: string;
        loadingLabel: string;
        filters: QueryManagerFilter[];
    };
}

export interface QueryManagerFilter {
    id: string;
    name: string;
    description: string;
    createdOn: string;
}

export const QueryManagerDialog = ({ vm, ...props }: QueryManagerDialogProps) => {
    return (
        <Dialog
            open={vm.isOpen}
            onClose={props.onClose}
            title={"Advanced search filter"}
            actions={
                <>
                    <Dialog.CancelAction onClick={props.onClose} text={"Cancel"} />
                    <Dialog.ConfirmAction onClick={props.onCreate} text={"Create new"} />
                </>
            }
        >
            {vm.isLoading && <OverlayLoader text={vm.loadingLabel} />}
            {vm.view === "EMPTY" && <Empty />}
            {vm.view === "LIST" && (
                <FilterList
                    filters={vm.filters}
                    onEdit={props.onEdit}
                    onRename={props.onRename}
                    onClone={props.onClone}
                    onDelete={props.onDelete}
                    onSelect={props.onSelect}
                />
            )}
        </Dialog>
    );
};
