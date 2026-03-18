import { FunnelFieldValueModel, FunnelFieldValueModelDto } from "../FunnelFieldValueModel";

export class StringFieldValue extends FunnelFieldValueModel<string> {
    static override type = "string";
    constructor(dto: FunnelFieldValueModelDto<string>) {
        super({ ...dto, type: "string" });
    }
}
