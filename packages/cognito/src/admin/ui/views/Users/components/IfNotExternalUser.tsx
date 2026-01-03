import React from "react";
import { useUserForm } from "~/ui/views/Users/hooks/useUserForm.js";
import { Cell, Grid } from "@webiny/ui/Grid/index.js";
import { Alert } from "@webiny/ui/Alert/index.js";
import { Elevation } from "@webiny/ui/Elevation/index.js";
import styled from "@emotion/styled";

interface IfNotExternalUserProps {
    children: React.ReactElement;
}

const FormWrapper = styled.div`
    margin: 24px 100px;
`;

export const IfNotExternalUser = ({ children }: IfNotExternalUserProps) => {
    const { user } = useUserForm();
    if (!user.external) {
        return children;
    }

    return (
        <FormWrapper>
            <Elevation z={1}>
                <Grid>
                    <Cell span={12}>
                        <Alert type={"info"} title={"External User"}>
                            This user is an external user and cannot be edited.
                        </Alert>
                    </Cell>
                </Grid>
            </Elevation>
        </FormWrapper>
    );
};
