import React from "react";

import { ReactComponent as Dashboard } from "@material-design-icons/svg/filled/auto_awesome_motion.svg";
import { i18n } from "@webiny/app/i18n";

import { Container, IconContainer, Label } from "./styled";
import { useFolders } from "~/hooks";

const t = i18n.ns("app-folders/components/tree/title");

const types = {
    page: t("All pages"),
    cms: t("All entries"),
    file: t("All files")
};

export const Title: React.FC = () => {
    const { folderType } = useFolders();

    return (
        <Container>
            {folderType && (
                <>
                    <IconContainer>
                        <Dashboard />
                    </IconContainer>
                    <Label>{types[folderType]}</Label>
                </>
            )}
        </Container>
    );
};
