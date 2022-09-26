import React from "react";
import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/auto_awesome_motion.svg";

import { Types } from "~/types";

import { Container, IconContainer, Label } from "./styled";

type Props = {
    type: keyof Types;
};

const types = {
    page: "All pages",
    cms: "All entries",
    file: "All files"
};

export const Title: React.FC<Props> = ({ type }) => {
    return (
        <Container>
            <IconContainer>
                <Dashboard />
            </IconContainer>
            <Label>{types[type]}</Label>
        </Container>
    );
};
