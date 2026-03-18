import {
    FunnelConditionOperatorModel,
    FunnelConditionOperatorModelDto
} from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

type FieldValue = FunnelFieldValueModel<string | number>;

interface NotIncludesConditionOperatorExtraParams {
    value?: string;
}

export class NotIncludesConditionOperator extends FunnelConditionOperatorModel<
    FieldValue,
    NotIncludesConditionOperatorExtraParams
> {
    static override supportedFieldValueTypes = ["string", "stringArray", "number", "numberArray"];
    static override type = "notIncludes";
    static override optionLabel = "not includes";

    constructor(dto: FunnelConditionOperatorModelDto<NotIncludesConditionOperatorExtraParams>) {
        super({
            type: "notIncludes",
            params: {
                extra: {
                    value: dto.params?.extra?.value
                }
            }
        });
    }

    override evaluate(value: FieldValue): boolean {
        if (!value.hasValue()) {
            return true;
        }

        if (!this.params.extra.value) {
            return false;
        }

        if (value.array) {
            return !Array.isArray(value.value) || !value.value.includes(this.params.extra.value);
        }

        return !String(value.value).includes(String(this.params.extra.value));
    }
}
