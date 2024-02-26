import React from "react";

import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";

import { Empty, FilterList } from "./components";

import { DialogContainer } from "./QueryManagerDialog.styled";

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
        <DialogContainer open={vm.isOpen} onClose={props.onClose}>
            <DialogTitle>{"Advanced search filter"}</DialogTitle>
            {vm.isLoading && <CircularProgress label={vm.loadingLabel} />}
            <DialogContent>
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
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={props.onClose}>{"Cancel"}</ButtonDefault>
                <ButtonPrimary onClick={props.onCreate}>{"Create new"}</ButtonPrimary>
            </DialogActions>
        </DialogContainer>
    );
};
