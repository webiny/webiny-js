import React from "react";
import { ReactComponent as SavedSearchIcon } from "@material-design-icons/svg/outlined/saved_search.svg";
import { ReactComponent as MoreIcon } from "@material-design-icons/svg/outlined/more_vert.svg";
import { DialogContainer, ListActions } from "./QueryManagerDialog.styled";
import { DialogActions, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import {
    List,
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ButtonDefault, ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { Menu, MenuItem } from "@webiny/ui/Menu";
import { CircularProgress } from "@webiny/ui/Progress";

interface QueryBuilderProps {
    onClose: () => void;
    onCreate: () => void;
    onEdit: (filterId: string) => void;
    onDelete: (filterId: string) => void;
    onSelect: (filterId: string) => void;
    vm: {
        isOpen: boolean;
        isLoading: boolean;
        loadingLabel: string;
        filters: QueryManagerFilter[];
    };
}

interface QueryManagerFilter {
    id: string;
    name: string;
    description: string;
}

export const QueryManagerDialog = ({ vm, ...props }: QueryBuilderProps) => {
    return (
        <DialogContainer open={vm.isOpen} onClose={props.onClose}>
            <DialogTitle>{"Advanced search filter"}</DialogTitle>
            {vm.isLoading && <CircularProgress label={vm.loadingLabel} />}
            <DialogContent>
                <List twoLine nonInteractive>
                    {vm.filters.map(filter => (
                        <ListItem key={filter.id}>
                            <ListItemText>
                                <ListItemTextPrimary>{filter.name}</ListItemTextPrimary>
                                <ListItemTextSecondary>{filter.description}</ListItemTextSecondary>
                            </ListItemText>
                            <ListItemMeta>
                                <ListActions>
                                    <Tooltip content={"Apply filter"}>
                                        <IconButton
                                            icon={<SavedSearchIcon />}
                                            label={"Apply filter"}
                                            onClick={() => props.onSelect(filter.id)}
                                        />
                                    </Tooltip>
                                    <Menu
                                        handle={
                                            <IconButton icon={<MoreIcon />} label={"Open menu"} />
                                        }
                                    >
                                        <MenuItem onClick={() => props.onEdit(filter.id)}>
                                            Edit
                                        </MenuItem>
                                        <MenuItem onClick={() => props.onDelete(filter.id)}>
                                            Delete
                                        </MenuItem>
                                    </Menu>
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={props.onClose}>{"Cancel"}</ButtonDefault>
                <ButtonPrimary onClick={props.onCreate}>{"Create new"}</ButtonPrimary>
            </DialogActions>
        </DialogContainer>
    );
};
