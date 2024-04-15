import React from "react";
import { Search } from "@webiny/app-aco";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Title } from "./Title";

import { Container, WrapperActions } from "./styled";

interface HeaderProps {
    title?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export const Header = (props: HeaderProps) => {
    const { title, searchValue, onSearchChange } = props;

    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <Title title={title} />
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <Search value={searchValue} onChange={onSearchChange} />
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
