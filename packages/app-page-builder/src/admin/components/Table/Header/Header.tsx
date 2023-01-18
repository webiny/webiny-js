import React, { ReactElement } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";

import { ButtonsCreate } from "~/admin/components/Table/Header/ButtonsCreate";
import { TableActions } from "~/admin/components/Table/Header/TableActions";
import { Title } from "~/admin/components/Table/Header/Title";

import { Container, WrapperActions } from "./styled";

export interface HeaderProps {
    title?: string;
    canCreate: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
    selected: string[];
}

export const Header = ({
    canCreate,
    onCreatePage,
    onCreateFolder,
    title,
    selected
}: HeaderProps): ReactElement => {
    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <TableActions selected={selected} />
                        {canCreate && (
                            <ButtonsCreate
                                onCreateFolder={onCreateFolder}
                                onCreatePage={onCreatePage}
                            />
                        )}
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
