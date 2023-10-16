import React from "react";

import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { CircularProgress } from "@webiny/ui/Progress";

import { Empty, FilterList } from "./components";

import { DialogContainer } from "./QueryManagerDialog.styled";

interface QueryBuilderProps {
    onClose: () => void;
    onCreate: () => void;
    onEdit: (filterId: string) => void;
    onRename: (filterId: string) => void;
    onClone: (filterId: string) => void;
    onDelete: (filterId: string) => void;
    onSelect: (filterId: string) => void;
    vm: {
        isOpen: boolean;
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

export const QueryManagerDialog = ({ vm, ...props }: QueryBuilderProps) => {
    return (
        <DialogContainer open={vm.isOpen} onClose={props.onClose}>
            <DialogTitle>{"Advanced search filter"}</DialogTitle>
            {vm.view === "LOADING" && <CircularProgress label={vm.loadingLabel} />}
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
