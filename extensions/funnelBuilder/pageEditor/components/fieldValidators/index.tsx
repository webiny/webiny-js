import React from "react";
import { FunnelFieldDefinitionModel } from "../../../models/FunnelFieldDefinitionModel";
import { requiredFieldValidator } from "./RequiredFieldValidatorPlugin";
import { minLengthFieldValidator } from "./MinLengthFieldValidatorPlugin";
import { maxLengthFieldValidator } from "./MaxLengthFieldValidatorPlugin";
import { lteFieldValidator } from "./LteLengthFieldValidatorPlugin";
import { gteFieldValidator } from "./GteLengthFieldValidatorPlugin";
import { patternFieldValidator } from "./PatternFieldValidatorPlugin";

export interface FieldValidatorSettingsProps {
    field: FunnelFieldDefinitionModel;
    setMessage: (message: string) => void;
}

export interface FieldValidatorDefinition {
    validatorType: string;
    label: string;
    description: string;
    settingsRenderer?: React.ComponentType<FieldValidatorSettingsProps>;
}

export const fieldValidators: FieldValidatorDefinition[] = [
    requiredFieldValidator,
    minLengthFieldValidator,
    maxLengthFieldValidator,
    lteFieldValidator,
    gteFieldValidator,
    patternFieldValidator
];
