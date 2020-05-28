import React from "react";

import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

import { Cell, Grid } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";

const Welcome = () => {
    return (
        <Grid>
            <Cell span={3} />
            <Cell span={6}>
                <SimpleForm>
                    <SimpleFormHeader title={"Welcome to Webiny!"} />
                    <SimpleFormContent>
                        Welcome to Webiny!
                        You are logged in as the first administrator of this application.
                        <Grid>
                            <Cell span={3}>
                                <ButtonPrimary>
                                    Create Content Model
                                </ButtonPrimary>
                            </Cell>
                            <Cell span={3}>
                                <ButtonPrimary>
                                    Join Community
                                </ButtonPrimary>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                </SimpleForm>
            </Cell>
        </Grid>
    );
};

export default Welcome;
