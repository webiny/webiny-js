import { FunnelFieldValueModel, FunnelFieldValueModelDto } from "../FunnelFieldValueModel";

export class NumberFieldValue extends FunnelFieldValueModel<number> {
    static override type = "number";
    constructor(dto: FunnelFieldValueModelDto<number>) {
        super({ ...dto, type: "number" });
    }
}
