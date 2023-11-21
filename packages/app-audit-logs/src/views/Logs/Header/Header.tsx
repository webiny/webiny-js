import React from "react";
import styled from "@emotion/styled";

import { Search } from "@webiny/app-aco";
import { Cell, Grid } from "@webiny/ui/Grid";

import { ButtonFilters } from "~/views/Logs/Header/ButtonFilters";
import { Text } from "~/components/Text";

const Container = styled("div")`
    padding: 8px 20px 8px 20px;
    width: 100%;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
    background: var(--mdc-theme-surface);
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
`;

const WrapperActions = styled("div")`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
`;

const TitleWrapper = styled("div")`
    display: flex;
    align-items: center;
    height: 100%;
`;

type HeaderProps = {
    title: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    showingFilters: boolean;
    hideFilters: () => void;
    showFilters: () => void;
};

export const Header: React.FC<HeaderProps> = ({
    title,
    searchValue,
    onSearchChange,
    showingFilters,
    hideFilters,
    showFilters
}) => {
    return (
        <Container>
            <Grid align={"right"} style={{ padding: 0 }}>
                <Cell span={4}>
                    <TitleWrapper>
                        <Text use={"headline5"}>{title}</Text>
                    </TitleWrapper>
                </Cell>
                <Cell span={8}>
                    <WrapperActions>
                        <Search value={searchValue} onChange={onSearchChange} />
                        <ButtonFilters
                            showingFilters={showingFilters}
                            hideFilters={hideFilters}
                            showFilters={showFilters}
                        />
                    </WrapperActions>
                </Cell>
            </Grid>
        </Container>
    );
};
