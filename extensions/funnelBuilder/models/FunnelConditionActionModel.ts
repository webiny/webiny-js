import { AbstractModel } from "./AbstractModel";
import { getRandomId } from "../utils/getRandomId";
import { FunnelConditionRuleModel } from "./FunnelConditionRuleModel";
import { FunnelStepModel } from "./FunnelStepModel";

export type ConditionActionParams<TExtra = Record<string, any>> = {
    extra: TExtra;
};

export type ConditionActionParamsDto<TExtra = Record<string, any>> = ConditionActionParams<TExtra>;

export interface FunnelConditionActionModelDto<TExtra = Record<string, any>> {
    id: string;
    type: string;
    params: ConditionActionParamsDto<TExtra>; // Additional parameters for the validator.
}

export class FunnelConditionActionModel<TExtra = Record<string, any>> extends AbstractModel<
    FunnelConditionActionModelDto<TExtra>
> {
    conditionRule: FunnelConditionRuleModel;
    id: string;
    type: string;
    params: ConditionActionParams<TExtra>;

    static type = "";

    // String shown in the conditional rules dialog (in the actions dropdown menu).
    static optionLabel = "";

    constructor(
        conditionRule: FunnelConditionRuleModel,
        dto?: Partial<FunnelConditionActionModelDto<TExtra>>
    ) {
        super();
        this.conditionRule = conditionRule;
        this.id = dto?.id || getRandomId();
        this.type = dto?.type || "";
        this.params = {
            extra: (dto?.params?.extra || {}) as TExtra
        };
    }

    toDto(): FunnelConditionActionModelDto<TExtra> {
        return { id: this.id, type: this.type, params: this.params };
    }

    isApplicable(): FunnelStepModel | undefined {
        return undefined;
    }

    static fromDto<TExtra = Record<string, any>>(
        conditionRule: FunnelConditionRuleModel,
        dto: FunnelConditionActionModelDto<TExtra>
    ): FunnelConditionActionModel<TExtra> {
        // Could not import the module directly because of circular dependency.
        return require("./conditionActions/conditionActionFactory").conditionActionFromDto(
            conditionRule,
            dto
        );
    }
}
