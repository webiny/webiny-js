import React from "react";
import styled from "@emotion/styled";
import { Grid } from "@webiny/admin-ui";
import { ButtonFilters } from "~/views/Logs/Header/ButtonFilters/index.js";
import { Text } from "~/components/Text.js";

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
    showingFilters: boolean;
    hideFilters: () => void;
    showFilters: () => void;
};

export const Header = ({ title, showingFilters, hideFilters, showFilters }: HeaderProps) => {
    return (
        <Container>
            <Grid style={{ padding: 0 }}>
                <Grid.Column span={4}>
                    <TitleWrapper>
                        <Text use={"headline5"}>{title}</Text>
                    </TitleWrapper>
                </Grid.Column>
                <Grid.Column span={8}>
                    <WrapperActions>
                        <ButtonFilters
                            showingFilters={showingFilters}
                            hideFilters={hideFilters}
                            showFilters={showFilters}
                        />
                    </WrapperActions>
                </Grid.Column>
            </Grid>
        </Container>
    );
};
