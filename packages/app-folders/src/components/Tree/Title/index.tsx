import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/home.svg";

import { Container, IconContainer } from "./styled";
import { Typography } from "@webiny/ui/Typography";

type Props = {
    title: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

export const Title: React.FC<Props> = ({ title, onClick }) => {
    return (
        <Container onClick={onClick} hasClickAction={Boolean(onClick)}>
            <IconContainer>
                <Dashboard />
            </IconContainer>
            <Typography use={"subtitle2"}>{title}</Typography>
        </Container>
    );
};
