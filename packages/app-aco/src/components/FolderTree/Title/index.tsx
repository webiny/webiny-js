import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/home.svg";
import { Typography } from "@webiny/ui/Typography";

import { Container, IconContainer } from "./styled";

interface TitleProps {
    title: string;
    isDragging: boolean;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const Title: React.VFC<TitleProps> = ({ title, onClick, isDragging }) => {
    return (
        <Container
            onClick={onClick}
            hasClickAction={Boolean(onClick)}
            isDragging={isDragging}
            data-testid="aco-folder-tree-title"
        >
            <IconContainer>
                <Dashboard />
            </IconContainer>
            <Typography use={"subtitle2"}>{title}</Typography>
        </Container>
    );
};
