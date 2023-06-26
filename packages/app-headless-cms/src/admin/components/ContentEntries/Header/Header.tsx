import React from "react";
import { ReactComponent as FilterIcon } from "@material-design-icons/svg/outlined/filter_alt.svg";
import { ReactComponent as CloseFilterIcon } from "@material-design-icons/svg/outlined/filter_alt_off.svg";
import { Search } from "@webiny/app-aco";
import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonsCreate } from "./ButtonsCreate";
import { Title } from "./Title";

import { Container, WrapperActions } from "./styled";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks";
import { IconButton } from "@webiny/ui/Button";

interface Props {
    title?: string;
    canCreate: boolean;
    onCreateEntry: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header: React.VFC<Props> = props => {
    const { canCreate, onCreateEntry, onCreateFolder, title, searchValue, onSearchChange } = props;

    const list = useContentEntriesList({});

    const toggleFilters = () => {
        if (list.showingFilters) {
            list.hideFilters();
        } else {
            list.showFilters();
        }
    };

    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <Search value={searchValue} onChange={onSearchChange} />
                        <IconButton
                            icon={list.showingFilters ? <CloseFilterIcon /> : <FilterIcon />}
                            onClick={toggleFilters}
                        />
                        {canCreate && (
                            <ButtonsCreate
                                onCreateFolder={onCreateFolder}
                                onCreateEntry={onCreateEntry}
                            />
                        )}
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
