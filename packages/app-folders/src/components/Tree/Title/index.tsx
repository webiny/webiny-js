import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/auto_awesome_motion.svg";

import { Container, IconContainer, Label } from "./styled";

type Props = {
    title: string;
};

export const Title: React.FC<Props> = ({ title }) => {
    return (
        <Container>
            <>
                <IconContainer>
                    <Dashboard />
                </IconContainer>
                <Label>{title}</Label>
            </>
        </Container>
    );
};
