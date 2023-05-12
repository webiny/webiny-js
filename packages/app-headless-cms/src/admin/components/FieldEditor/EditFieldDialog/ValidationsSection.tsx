import React from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { ValidatorsList } from "./ValidatorsList";
import { CmsModelFieldValidatorConfigAdapter } from "~/utils/CmsModelFieldValidatorConfigAdapter";

interface ValidatorsSectionProps {
    title: string;
    fieldKey: "validators" | "listValidators";
    description: string;
    validators: CmsModelFieldValidatorConfigAdapter[];
}

const bindTo = {
    validators: "validation",
    listValidators: "listValidation"
};

export const ValidationsSection = ({
    title,
    description,
    fieldKey,
    validators
}: ValidatorsSectionProps) => {
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
