import React, { useMemo } from "react";
import {
    DataList,
    ScrollList,
    ListItem,
    ListItemText,
    ListItemMeta,
    ListActions,
    ListItemTextSecondary,
    DataListModalOverlay,
    DataListModalOverlayAction
} from "@webiny/ui/List";

import { DeleteIcon } from "@webiny/ui/List/DataList/icons";
import { ButtonIcon, ButtonSecondary } from "@webiny/ui/Button";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { ReactComponent as FilterIcon } from "@webiny/app-admin/assets/icons/filter-24px.svg";
import { useTargetsList } from "./hooks/useTargetsList";

const sorters = [
    {
        label: "Newest to oldest",
        sorters: { createdOn: "asc" }
    },
    {
        label: "Oldest to newest",
        sorters: { createdOn: "desc" }
    }
];

const TargetsDataList = () => {
    const {
        targets,
        loading,
        currentTargetId,
        createTarget,
        sort,
        setSort,
        serializeSorters,
        editTarget,
        deleteTarget
    } = useTargetsList({ sorters });

    const targetsDataListModalOverlay = useMemo(
        () => (
            <DataListModalOverlay>
                <Grid>
                    <Cell span={12}>
                        <Select value={sort} onChange={setSort} label={"Sort by"}>
                            {sorters.map(({ label, sorters }) => {
                                return (
                                    <option key={label} value={serializeSorters(sorters)}>
                                        {label}
                                    </option>
                                );
                            })}
                        </Select>
                    </Cell>
                </Grid>
            </DataListModalOverlay>
        ),
        [sort]
    );

    return (
        <DataList
            loading={loading}
            actions={
                <ButtonSecondary onClick={createTarget}>
                    <ButtonIcon icon={<AddIcon />} /> {"New Target"}
                </ButtonSecondary>
            }
            data={targets}
            title={"Targets"}
            modalOverlay={targetsDataListModalOverlay}
            modalOverlayAction={<DataListModalOverlayAction icon={<FilterIcon />} />}
        >
            {({ data }) => (
                <ScrollList>
                    {data.map(item => (
                        <ListItem key={item.id} selected={item.id === currentTargetId}>
                            <ListItemText onClick={() => editTarget(item.id)}>
                                {item.id}
                                <ListItemTextSecondary>
                                    {item.default && "Default target"}
                                </ListItemTextSecondary>
                            </ListItemText>

                            <ListItemMeta>
                                <ListActions>
                                    <DeleteIcon onClick={() => deleteTarget(item)} />
                                </ListActions>
                            </ListItemMeta>
                        </ListItem>
                    ))}
                </ScrollList>
            )}
        </DataList>
    );
};

export default TargetsDataList;
