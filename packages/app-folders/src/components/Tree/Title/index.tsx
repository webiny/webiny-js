import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/auto_awesome_motion.svg";

import { Container, IconContainer, Label } from "./styled";

type Props = {
    title: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
};

export const Title: React.FC<Props> = ({ title, onClick }) => {
    return (
        <Container onClick={onClick} hasClickAction={Boolean(onClick)}>
            <>
                <IconContainer>
                    <Dashboard />
                </IconContainer>
                <Label>{title}</Label>
            </>
        </Container>
    );
};
