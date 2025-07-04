import { FunnelStepModel, FunnelStepModelDto } from "./FunnelStepModel";
import {
    FunnelFieldDefinitionModel,
    FunnelFieldDefinitionModelDto
} from "./FunnelFieldDefinitionModel";
import { FunnelConditionRuleModel, FunnelConditionRuleModelDto } from "./FunnelConditionRuleModel";
import { SuccessStep } from "./steps/SuccessStep";

export interface FunnelModelDto {
    steps: FunnelStepModelDto[];
    fields: FunnelFieldDefinitionModelDto[];
    conditionRules: FunnelConditionRuleModelDto[];
}

export class FunnelModel {
    fields: FunnelFieldDefinitionModel[] = [];
    steps: FunnelStepModel[] = [];
    conditionRules: FunnelConditionRuleModel[];

    constructor(dto?: Partial<FunnelModelDto>) {
        this.fields = dto?.fields?.map(f => FunnelFieldDefinitionModel.fromDto(f)) || [];
        this.steps = dto?.steps?.map(s => FunnelStepModel.fromDto(s)) || [
            new FunnelStepModel(),
            new SuccessStep()
        ];
        if (!this.steps.find(step => step.id === "success")) {
            this.steps.push(new SuccessStep());
        }

        this.conditionRules =
            dto?.conditionRules?.map(dto => FunnelConditionRuleModel.fromDto(this, dto)) || [];
    }

    toDto(): FunnelModelDto {
        return {
            steps: this.steps.map(s => s.toDto()),
            fields: this.fields.map(f => f.toDto()),
            conditionRules: this.conditionRules.map(rule => rule.toDto())
        };
    }

    static fromDto(dto: FunnelModelDto): FunnelModel {
        return new FunnelModel(dto);
    }

    // Steps. 👇
    updateStep(stepId: string, stepDto: Partial<FunnelStepModelDto>) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) {
            return;
        }
        step.populate(stepDto);
    }

    removeStep(id: string) {
        this.steps = this.steps.filter(step => step.id !== id);
    }

    getStep(id: string) {
        return this.steps.find(step => step.id === id);
    }

    // Other methods. 👇
    populate(funnelDto: Partial<FunnelModelDto>) {
        if (funnelDto.fields) {
            this.fields = funnelDto.fields.map(f => FunnelFieldDefinitionModel.fromDto(f));
        }
        if (funnelDto.steps) {
            this.steps = funnelDto.steps.map(s => FunnelStepModel.fromDto(s));
        }
        if (funnelDto.conditionRules) {
            this.conditionRules = funnelDto.conditionRules.map(
                dto => FunnelConditionRuleModel.fromDto(this, dto)
            );
        }
    }

    getChecksum() {
        return this.steps
            .map(step => step.getChecksum())
            .concat(this.fields.map(field => field.getChecksum()))
            .join("");
    }

    validate() {
        // 1. Get all `sourceFieldId` and `targetFieldId` field IDs from condition rules
        // and ensure they exist in the funnel model / fields array.
        const conditionRulesJson = JSON.stringify(this.conditionRules.map(rule => rule.toDto()));
        const sourceFieldIds =
            conditionRulesJson
                .match(/"sourceFieldId":"([^"]+)"/g)
                ?.filter(Boolean)
                .map(id => id.replace(/"sourceFieldId":"([^"]+)"/, "$1")) || [];

        const targetFieldIds =
            conditionRulesJson
                .match(/"targetFieldId":"([^"]+)"/g)
                ?.filter(Boolean)
                .map(id => id.replace(/"targetFieldId":"([^"]+)"/, "$1")) || [];

        const allFieldIds = [...sourceFieldIds, ...targetFieldIds];
        const allFieldIdsSet = new Set(allFieldIds);

        const allFieldIdsInModel = this.fields.map(field => field.id);
        const allFieldIdsInModelSet = new Set(allFieldIdsInModel);
        const missingFieldIds = [...allFieldIdsSet].filter(id => !allFieldIdsInModelSet.has(id));
        if (missingFieldIds.length > 0) {
            throw new Error("Condition rules reference fields that do not exist in the model.", {
                cause: { missingFieldIds }
            });
        }

        // 2. Ensure fields reference steps that exist in the funnel model.
        const allStepIds = this.steps.map(step => step.id);
        const allStepIdsSet = new Set(allStepIds);

        const missingStepIds = this.fields
            .map(field => field.stepId)
            .filter(stepId => !allStepIdsSet.has(stepId));

        if (missingStepIds.length > 0) {
            throw new Error("Fields reference steps that do not exist in the model.", {
                cause: { missingStepIds }
            });
        }
    }
}
