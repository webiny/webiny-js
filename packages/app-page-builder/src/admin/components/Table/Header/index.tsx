import React, { ReactElement } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";

import { ButtonsCreate } from "~/admin/components/Table/Header/ButtonsCreate";
import { Title } from "~/admin/components/Table/Header/Title";

import { Container } from "./styled";

interface Props {
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
}: Props): ReactElement => {
    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                {canCreate && (
                    <Cell span={8}>
                        <ButtonsCreate
                            onCreateFolder={onCreateFolder}
                            onCreatePage={onCreatePage}
                            selected={selected}
                        />
                    </Cell>
                )}
            </Grid>
        </Container>
    );
};
