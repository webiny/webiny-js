// @flow
import { Entity } from "webiny-entity";
import { Model } from "webiny-model";
import type { IForm } from "webiny-api-forms/entities";

class MetaModel extends Model {
    constructor(props) {
        super(props);
        this.attr("ip")
            .char()
            .setValidators("required");
        this.attr("submittedOn")
            .date()
            .setValidators("required")
            .setSkipOnPopulate();
    }
}

export interface IFormSubmission extends Entity {
    form: ?Entity;
    data: Object;
    meta: Object;
}

export default ({ getEntities }: Object) =>
    class FormSubmission extends Entity {
        static classId = "FormSubmission";

        form: ?IForm;
        data: Object;
        meta: Object;
        submittedOn: ?Date;

        constructor() {
            super();
            const { CmsForm } = getEntities();

            this.attr("form")
                .entity(CmsForm)
                .setValidators("required");
            this.attr("data")
                .object()
                .setValidators("required");
            this.attr("meta")
                .model(MetaModel)
                .setValidators("required");

            this.on("beforeCreate", async () => {
                this.meta.submittedOn = new Date();
            });

            this.on("afterCreate", async () => {
                const form = await this.form;
                if (form) {
                    form.stats.incrementSubmissions();
                    await form.save();
                }
            });
        }
    };
