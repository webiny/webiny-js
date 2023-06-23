import React from "react";
import { Search } from "@webiny/app-aco";
import { Grid, Cell } from "@webiny/ui/Grid";

import { ButtonsCreate } from "~/admin/components/Table/Header/ButtonsCreate";
import { TableActions } from "~/admin/components/Table/Header/TableActions";
import { Title } from "~/admin/components/Table/Header/Title";

import { Container, Divider, WrapperActions } from "./styled";

export interface HeaderProps {
    title?: string;
    canCreate: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onImportPage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    selected: string[];
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header: React.VFC<HeaderProps> = ({
    canCreate,
    onCreatePage,
    onImportPage,
    onCreateFolder,
    title,
    selected,
    searchValue,
    onSearchChange
}) => {
    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <Search value={searchValue} onChange={onSearchChange} />
                        <Divider />
                        <TableActions selected={selected} onImportPage={onImportPage} />
                        {canCreate && (
                            <>
                                <Divider />
                                <ButtonsCreate
                                    onCreateFolder={onCreateFolder}
                                    onCreatePage={onCreatePage}
                                />
                            </>
                        )}
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
