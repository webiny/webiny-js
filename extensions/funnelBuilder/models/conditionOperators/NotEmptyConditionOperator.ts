import { FunnelConditionOperatorModel } from "../FunnelConditionOperatorModel";
import { FunnelFieldValueModel } from "../FunnelFieldValueModel";

export class NotEmptyConditionOperator extends FunnelConditionOperatorModel {
    static override supportedFieldValueTypes = ["*"];
    static override type = "notEmpty";
    static override optionLabel = "not empty";

    constructor() {
        super({
            type: "notEmpty",
            params: {
                extra: {}
            }
        });
    }

    override evaluate(value: FunnelFieldValueModel): boolean {
        return value.hasValue();
    }
}
