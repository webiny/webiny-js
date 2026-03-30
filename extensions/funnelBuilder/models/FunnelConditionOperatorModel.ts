import { AbstractModel } from "./AbstractModel";
import { FunnelFieldValueModel } from "./FunnelFieldValueModel";

export type ConditionOperatorParams<TExtra = Record<string, any>> = {
    extra: TExtra;
};

export type ConditionOperatorParamsDto<TExtra = Record<string, any>> =
    ConditionOperatorParams<TExtra>;

export interface FunnelConditionOperatorModelDto<TExtra = Record<string, any>> {
    type: string;
    params: ConditionOperatorParamsDto<TExtra>; // Additional parameters for the validator.
}

export class FunnelConditionOperatorModel<
    TValue = FunnelFieldValueModel,
    TExtra = Record<string, any>
> extends AbstractModel<FunnelConditionOperatorModelDto<TExtra>> {
    type: string;
    params: ConditionOperatorParams<TExtra>;

    static type = "";

    // String shown in the conditional rules dialog (in the operators dropdown menu).
    static optionLabel = "";
    static supportedFieldValueTypes: string[] = [];

    constructor(dto?: Partial<FunnelConditionOperatorModelDto<TExtra>>) {
        super();
        this.type = dto?.type || "";
        this.params = {
            extra: (dto?.params?.extra || {}) as TExtra
        };
    }

    // eslint-disable-next-line
    evaluate(value: TValue) {
        return true;
    }

    toDto(): FunnelConditionOperatorModelDto<TExtra> {
        return { type: this.type, params: this.params };
    }

    static fromDto<TValue = unknown, TExtra = Record<string, any>>(
        dto: FunnelConditionOperatorModelDto<TExtra>
    ): FunnelConditionOperatorModel<TValue, TExtra> {
        // Could not import the module directly because of circular dependency.
        return require("./conditionOperators/conditionOperatorFactory").conditionOperatorFromDto(
            dto
        );
    }
}
