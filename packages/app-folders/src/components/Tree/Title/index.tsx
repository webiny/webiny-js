import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/auto_awesome_motion.svg";
import { i18n } from "@webiny/app/i18n";

import { Types } from "~/types";

import { Container, IconContainer, Label } from "./styled";

type Props = {
    type: keyof Types;
};

const t = i18n.ns("app-folders/components/tree/title");

const types = {
    page: t("All pages"),
    cms: t("All entries"),
    file: t("All files")
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
