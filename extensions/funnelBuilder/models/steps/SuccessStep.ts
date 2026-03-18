import { FunnelStepModel } from "../FunnelStepModel";

export class SuccessStep extends FunnelStepModel {
    constructor() {
        super({
            id: "success",
            title: "Success page"
        });
    }
}
