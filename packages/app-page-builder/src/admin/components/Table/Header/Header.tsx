import React from "react";
import { Search } from "@webiny/app-aco";
import { Grid, Cell } from "@webiny/ui/Grid";

import { ButtonsCreate } from "~/admin/components/Table/Header/ButtonsCreate";
import { TableActions } from "~/admin/components/Table/Header/TableActions";
import { Title } from "~/admin/components/Table/Header/Title";

import { Container, Divider, WrapperActions } from "./styled";
import { PbPageDataItem } from "~/types";
import { SearchRecordItem } from "@webiny/app-aco/types";

export interface HeaderProps {
    title?: string;
    canCreateFolder: boolean;
    canCreateContent: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onImportPage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    selected: SearchRecordItem<PbPageDataItem>[];
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header = ({
    canCreateFolder,
    canCreateContent,
    onCreatePage,
    onImportPage,
    onCreateFolder,
    title,
    selected,
    searchValue,
    onSearchChange
}: HeaderProps) => {
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
                        <Divider />
                        <ButtonsCreate
                            canCreateFolder={canCreateFolder}
                            canCreatePage={canCreateContent}
                            onCreateFolder={onCreateFolder}
                            onCreatePage={onCreatePage}
                        />
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
