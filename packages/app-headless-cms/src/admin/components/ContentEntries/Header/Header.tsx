import React from "react";
import { Search } from "@webiny/app-aco";
import { Cell, Grid } from "@webiny/ui/Grid";

import { ButtonFilters } from "./ButtonFilters";
import { ButtonsCreate } from "./ButtonsCreate";
import { Title } from "./Title";

import { Container, WrapperActions } from "./styled";

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

    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <Search value={searchValue} onChange={onSearchChange} />
                        <ButtonFilters />
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
