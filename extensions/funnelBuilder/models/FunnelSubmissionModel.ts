import { FunnelModel } from "./FunnelModel";
import {
    FunnelSubmissionFieldModel,
    FunnelSubmissionFieldModelDto
} from "./FunnelSubmissionFieldModel";
import { createObjectHash } from "../utils/createObjectHash";
import { FunnelConditionRulesEvaluator } from "./FunnelConditionRulesEvaluator";
import { FunnelConditionActionModel } from "./FunnelConditionActionModel";
import { OnSubmitEndFunnelConditionAction } from "./conditionActions/OnSubmitEndFunnelConditionAction";
import { FunnelStepModel } from "./FunnelStepModel";
import { OnSubmitActivateStepConditionAction } from "./conditionActions/OnSubmitActivateStepConditionAction";

export interface FunnelSubmissionModelDto {
    fields: Record<string, FunnelSubmissionFieldModelDto>;
    activeStepId: string;
    completedStepIds: string[];
}

export interface FunnelEntryValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

export type FunnelSubmissionData = Record<string, any>;

export type OnFinishedListener = (data: FunnelSubmissionData) => void | Promise<void>;

export type FunnelSubmissionStepSubmissionResult =
    | {
          success: true;
          message: string;
          errors: null;
          data: Record<string, any>;
      }
    | {
          success: false;
          message: string;
          errors: Record<string, any>;
          data: Record<string, any>;
      };

export class FunnelSubmissionModel {
    funnel: FunnelModel;
    fields: Record<string, FunnelSubmissionFieldModel>;
    activeStepId: string;
    completedStepIds: string[];
    private onFinishListeners: Set<OnFinishedListener> = new Set();
    private conditionRules: {
        evaluator: FunnelConditionRulesEvaluator;
        applicableActions: FunnelConditionActionModel[];
    };

    constructor(funnel: FunnelModel, funnelSubmissionDto?: FunnelSubmissionModelDto) {
        this.funnel = funnel;
        this.activeStepId = funnelSubmissionDto?.activeStepId || funnel.steps[0].id;
        this.completedStepIds = funnelSubmissionDto?.completedStepIds || [];
        this.fields = funnel.fields.reduce(
            (acc, field) => {
                acc[field.fieldId] = new FunnelSubmissionFieldModel(
                    this,
                    field,
                    funnelSubmissionDto?.fields[field.fieldId]
                );
                return acc;
            },
            {} as Record<string, FunnelSubmissionFieldModel>
        );

        this.conditionRules = {
            evaluator: new FunnelConditionRulesEvaluator(this),
            applicableActions: []
        };
    }

    toDto(): FunnelSubmissionModelDto {
        return {
            activeStepId: this.activeStepId,
            completedStepIds: this.completedStepIds,
            fields: Object.values(this.fields).reduce(
                (acc, field) => {
                    acc[field.definition.fieldId] = field.toDto();
                    return acc;
                },
                {} as Record<string, FunnelSubmissionFieldModelDto>
            )
        };
    }

    static fromDto(funnel: FunnelModel, dto: FunnelSubmissionModelDto): FunnelSubmissionModel {
        return new FunnelSubmissionModel(funnel, dto);
    }

    setData(data: Record<string, any>) {
        Object.keys(data).forEach(key => {
            if (this.fields[key]) {
                this.fields[key].value.value = data[key];
            }
        });

        this.evaluateRelatedConditionRules();
    }

    start() {
        this.evaluateRelatedConditionRules();
    }

    onFinish(listener: OnFinishedListener) {
        this.onFinishListeners.add(listener);
        return () => {
            this.onFinishListeners.delete(listener);
        };
    }

    finish() {
        for (const listener of this.onFinishListeners) {
            listener(this.getData());
        }
    }

    getData() {
        return Object.values(this.fields).reduce(
            (acc, field) => {
                acc[field.definition.fieldId] = field.getRawValue();
                return acc;
            },
            {} as Record<string, any>
        );
    }

    getDataForActiveStep() {
        const activeStepFields = this.getFieldsForActiveStep();
        return activeStepFields.reduce(
            (acc, field) => {
                acc[field.definition.fieldId] = field.getRawValue();
                return acc;
            },
            {} as Record<string, any>
        );
    }

    async validate() {
        const validationResult: FunnelEntryValidationResult = {
            isValid: true,
            errors: {}
        };

        for (const field of Object.values(this.fields)) {
            const fieldValidation = await field.validate();
            if (!fieldValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors[field.definition.fieldId] = fieldValidation.errorMessage;
            }
        }

        return validationResult;
    }

    async submitActiveStep(): Promise<FunnelSubmissionStepSubmissionResult> {
        if (this.isSuccessStep()) {
            return {
                message: "Cannot submit success step.",
                success: false,
                errors: {},
                data: {}
            };
        }

        const validationResult = await this.validateActiveStep();
        const data = this.getDataForActiveStep();

        if (!validationResult.isValid) {
            return {
                message: "Field validation failed.",
                success: false,
                errors: validationResult.errors,
                data
            };
        }

        // Before activating the next step, we need to evaluate the condition rules.
        this.evaluateRelatedConditionRules();

        const success = () => {
            if (this.isSuccessStep()) {
                this.finish();
            }

            return {
                message: "",
                success: true,
                errors: null,
                data
            } as FunnelSubmissionStepSubmissionResult;
        };

        // Mark the current step as completed.
        this.completedStepIds.push(this.activeStepId);

        const activeActions = this.conditionRules.applicableActions;
        if (activeActions.length > 0) {
            // Check if there's an action that requires us to end the funnel.
            const mustEndFunnel = activeActions.some(
                a => a.type === OnSubmitEndFunnelConditionAction.type
            );

            if (mustEndFunnel) {
                this.activateSuccessStep();
                return success();
            }

            // Check if there's an action that requires us to activate a specific step.
            // We can only activate one step at a time.
            const [activateSpecificStepAction] = activeActions.filter(
                a => a.type === OnSubmitActivateStepConditionAction.type
            );

            if (activateSpecificStepAction) {
                const step = this.funnel.getStep(
                    activateSpecificStepAction.params.extra.targetStepId
                );

                if (step) {
                    this.activateStep(step);
                    return success();
                }
            }
        }

        // Get the next step.
        const nextStepIndex =
            this.funnel.steps.findIndex(step => step.id === this.activeStepId) + 1;

        const nextStep = this.funnel.steps[nextStepIndex];

        this.activateStep(nextStep);
        return success();
    }

    async validateActiveStep() {
        const activeStepFields = this.getFieldsForActiveStep();
        const validationResult: FunnelEntryValidationResult = {
            isValid: true,
            errors: {}
        };

        for (const field of activeStepFields) {
            const fieldValidation = await field.validate();
            if (!fieldValidation.isValid) {
                validationResult.isValid = false;
                validationResult.errors[field.definition.fieldId] = fieldValidation.errorMessage;
            }
        }

        return validationResult;
    }

    // Fields-related methods. 👇
    getField(fieldId: string) {
        return this.fields[fieldId];
    }

    getFieldById(id: string) {
        return Object.values(this.fields).find(field => field.definition.id === id);
    }

    fieldExists(fieldId: string) {
        return !!this.fields[fieldId];
    }

    getFieldsForActiveStep() {
        const activeStep = this.funnel.steps.find(step => step.id === this.activeStepId);
        if (!activeStep) {
            return [];
        }

        return Object.values(this.fields).filter(
            field => field.definition.stepId === activeStep.id
        );
    }

    // Steps-related methods. 👇
    getActiveStepIndex() {
        return this.funnel.steps.findIndex(step => step.id === this.activeStepId);
    }

    getActiveStep() {
        return this.funnel.steps.find(step => step.id === this.activeStepId)!;
    }

    getPreviousStep() {
        if (this.isFirstStep()) {
            return null;
        }

        const previousStepId = this.completedStepIds[this.completedStepIds.length - 1];
        return this.funnel.steps.find(step => step.id === previousStepId);
    }

    activatePreviousStep() {
        const previousStep = this.getPreviousStep();
        if (!previousStep) {
            return;
        }

        this.completedStepIds.pop();
        this.activateStep(previousStep);
    }

    getFinalStepIndex() {
        return this.funnel.steps.length - 2;
    }

    getFinalStep() {
        const index = this.getFinalStepIndex();
        return this.funnel.steps[index];
    }

    isFinalStep() {
        return this.getActiveStepIndex() === this.getFinalStepIndex();
    }

    getSuccessStepIndex() {
        return this.funnel.steps.length - 1;
    }

    getSuccessStep() {
        const index = this.getSuccessStepIndex();
        return this.funnel.steps[index];
    }

    activateSuccessStep() {
        this.activateStep(this.getSuccessStep());
    }

    isSuccessStep() {
        return this.getActiveStepIndex() === this.funnel.steps.length - 1;
    }

    isFirstStep() {
        return this.getActiveStepIndex() === 0;
    }

    getStepsCount() {
        return this.funnel.steps.length;
    }

    activateStep(step: FunnelStepModel) {
        this.activeStepId = step.id;
    }

    // Other methods. 👇
    getChecksum() {
        return createObjectHash({
            applicableActions: this.conditionRules.applicableActions,
            dto: this.toDto()
        });
    }

    evaluateRelatedConditionRules() {
        this.conditionRules.applicableActions =
            this.conditionRules.evaluator.evaluateRelatedConditionRules();
        return this.conditionRules.applicableActions;
    }

    getApplicableActions() {
        return this.conditionRules.applicableActions;
    }
}
