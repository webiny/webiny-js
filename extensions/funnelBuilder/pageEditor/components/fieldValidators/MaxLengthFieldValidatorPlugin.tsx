import React from "react";
import { Grid, Input } from "webiny/admin/ui";
import { Bind } from "webiny/admin/form";
import { required } from "../../../utils/validators";
import { FieldValidatorDefinition } from "./index";

const ValidatorSettings = () => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name={"params.extra.threshold"} validators={required}>
                    <Input
                        type={"number"}
                        label={"Value"}
                        description={"This is the maximum allowed length."}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

export const maxLengthFieldValidator: FieldValidatorDefinition = {
    validatorType: "maxLength",
    label: "Max length",
    description: "Entered value must not be longer than the provided max length.",
    settingsRenderer: ValidatorSettings
};
