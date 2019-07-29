// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/admin/components";

const GeneralSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"termsOfServiceMessage"}>
                        <I18NInput
                            richText
                            label={"Terms of service message"}
                            description={
                                "Show this message near the submit button or event ask users to accept before submitting."
                            }
                        />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default GeneralSettings;
