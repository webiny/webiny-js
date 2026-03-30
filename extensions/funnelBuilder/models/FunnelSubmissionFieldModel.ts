import { FunnelFieldDefinitionModel } from "./FunnelFieldDefinitionModel";
import { FunnelSubmissionModel } from "./FunnelSubmissionModel";
import { FunnelFieldValueModel } from "./FunnelFieldValueModel";
import { DisableFieldConditionAction } from "./conditionActions/DisableFieldConditionAction";
import { HideFieldConditionAction } from "./conditionActions/HideFieldConditionAction";

export interface FunnelSubmissionFieldModelDto<
    TFieldValue extends FunnelFieldValueModel = FunnelFieldValueModel
> {
    value: TFieldValue;
}

export type FunnelSubmissionFieldValidationResult =
    | {
          isValid: true;
          errorMessage: null;
      }
    | {
          isValid: false;
          errorMessage: string;
      };

export class FunnelSubmissionFieldModel<
    TFunnelFieldDefinitionModel extends FunnelFieldDefinitionModel = FunnelFieldDefinitionModel
> {
    submission: FunnelSubmissionModel;
    definition: TFunnelFieldDefinitionModel;
    value: TFunnelFieldDefinitionModel["value"];

    constructor(
        funnelSubmission: FunnelSubmissionModel,
        funnelFieldDefinition: TFunnelFieldDefinitionModel,
        funnelSubmissionFieldDto?: FunnelSubmissionFieldModelDto<
            TFunnelFieldDefinitionModel["value"]
        >
    ) {
        this.submission = funnelSubmission;
        this.definition = funnelFieldDefinition;
        if (funnelSubmissionFieldDto?.value) {
            this.value = FunnelFieldValueModel.fromDto(funnelSubmissionFieldDto?.value);
        } else {
            this.value = this.definition.value.clone();
        }
    }

    toDto(): FunnelSubmissionFieldModelDto<TFunnelFieldDefinitionModel["value"]> {
        return {
            value: this.value
        };
    }

    static fromDto<
        TFunnelFieldDefinitionModel extends FunnelFieldDefinitionModel = FunnelFieldDefinitionModel
    >(
        funnelSubmission: FunnelSubmissionModel,
        funnelFieldDefinition: FunnelFieldDefinitionModel,
        dto: FunnelSubmissionFieldModelDto<TFunnelFieldDefinitionModel["value"]>
    ): FunnelSubmissionFieldModel {
        return new FunnelSubmissionFieldModel(funnelSubmission, funnelFieldDefinition, dto);
    }

    getValue() {
        return this.value;
    }

    getRawValue() {
        return this.value.value;
    }

    setValue(value: TFunnelFieldDefinitionModel["value"]) {
        this.value.value = value;
    }

    get disabled() {
        // Get the actions from the evaluator
        const actions = this.submission.getApplicableActions();

        // Check if any action is to disable this field
        return actions.some(
            action =>
                action.type === DisableFieldConditionAction.type &&
                action.params.extra.targetFieldId === this.definition.id
        );
    }

    get hidden() {
        // Get the actions from the evaluator
        const actions = this.submission.getApplicableActions();

        // Check if any action is to disable this field
        return actions.some(
            action =>
                action.type === HideFieldConditionAction.type &&
                action.params.extra.targetFieldId === this.definition.id
        );
    }

    async validate(): Promise<FunnelSubmissionFieldValidationResult> {
        if (this.hidden || this.disabled) {
            return {
                isValid: true,
                errorMessage: null
            };
        }

        const validators = this.definition.validators;

        for (const validator of validators) {
            if (!(await validator.isValid(this.value))) {
                return {
                    isValid: false,
                    errorMessage: validator.getErrorMessage()
                };
            }
        }

        return {
            isValid: true,
            errorMessage: null
        };
    }

    async ensureValid() {
        const result = await this.validate();
        if (!result.isValid) {
            throw new Error(result.errorMessage);
        }
    }
}
