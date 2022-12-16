import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { ValidatorsList } from "./ValidatorsList";
import { ValidationSection } from "./getValidators";

interface ValidatorsSectionProps {
    title: string;
    fieldKey: "validators" | "listValidators";
    description: string;
    validation: ValidationSection;
}

const bindTo = {
    validators: "validation",
    listValidators: "listValidation"
};

export const ValidationsSection = ({ fieldKey, validation, ...props }: ValidatorsSectionProps) => {
    const { validators } = validation;
    const title = validation.title || props.title;
    const description = validation.description || props.description;

    return (
        <Grid>
            <Cell span={12}>
                <Typography use={"headline5"}>{title}</Typography>
                <br />
                <Typography use={"body2"}>{description}</Typography>
            </Cell>
            <Cell span={12}>
                <ValidatorsList name={bindTo[fieldKey]} validators={validators} />
            </Cell>
        </Grid>
    );
};
