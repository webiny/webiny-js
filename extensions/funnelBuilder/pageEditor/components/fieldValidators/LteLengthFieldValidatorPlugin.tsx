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
                        description={"This is the maximum value that will be allowed."}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

export const lteFieldValidator: FieldValidatorDefinition = {
    validatorType: "lte",
    label: "Lower or equal",
    description: "Entered value must be equal or lower than the provided max value.",
    settingsRenderer: ValidatorSettings
};
