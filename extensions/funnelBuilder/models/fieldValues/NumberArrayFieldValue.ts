import { FunnelFieldValueModel, FunnelFieldValueModelDto } from "../FunnelFieldValueModel";

export class NumberArrayFieldValue extends FunnelFieldValueModel<number[]> {
    static override type = "numberArray";
    constructor(dto: FunnelFieldValueModelDto<number[]>) {
        super({ ...dto, type: "numberArray", array: true, value: dto.value });
    }
}
