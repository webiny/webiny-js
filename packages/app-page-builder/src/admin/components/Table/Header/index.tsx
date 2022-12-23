import React, { ReactElement } from "react";

import { i18n } from "@webiny/app/i18n";

import { ButtonPrimary, ButtonSecondary } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";

import { Title } from "~/admin/components/Table/Header/Title";

import { ButtonContainer, Container } from "./styled";

const t = i18n.ns("app-page-builder/admin/views/pages/table/header");

interface Props {
    title?: string;
    canCreate: boolean;
    onCreatePage: (event?: React.SyntheticEvent) => void;
    onCreateFolder: (event?: React.SyntheticEvent) => void;
}

export const Header = ({ canCreate, onCreatePage, onCreateFolder, title }: Props): ReactElement => {
    if (canCreate) {
        return (
            <Container>
                <Grid align={"right"} style={{ padding: 0 }}>
                    <Cell span={4}>
                        <Title title={title} />
                    </Cell>
                    <Cell span={8} order={4}>
                        <ButtonContainer>
                            <ButtonSecondary
                                data-testid="new-folder-button"
                                onClick={onCreateFolder}
                            >
                                {t`New Folder`}
                            </ButtonSecondary>
                            <ButtonPrimary
                                data-testid="new-page-button"
                                onClick={onCreatePage}
                                flat={true}
                            >
                                {t`New Page`}
                            </ButtonPrimary>
                        </ButtonContainer>
                    </Cell>
                </Grid>
            </Container>
        );
    }

    return <></>;
};
