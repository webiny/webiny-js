// @flow
import { Entity, EntityModel } from "webiny-entity";
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

class LogModel extends Model {
    constructor(props) {
        super(props);
        this.attr("type")
            .char()
            .setValidators("required,in:error:warning:info:success");
        this.attr("message").char();
        this.attr("data").object();
        this.attr("createdOn")
            .date()
            .setValue(new Date());
    }
}

export interface IFormSubmission extends Entity {
    form: ?Entity;
    data: Object;
    meta: Object;
}

const createFormAttributeModel = context =>
    class FormAttributeModel extends EntityModel {
        constructor() {
            super();
            const { CmsForm } = context.getEntities();

            this.setParentEntity(context.form);
            this.attr("parent")
                .entity(CmsForm)
                .setValidators("required");
            this.attr("revision")
                .entity(CmsForm)
                .setValidators("required");
        }
    };

export default (context: Object) =>
    class FormSubmission extends Entity {
        static classId = "FormSubmission";

        form: ?IForm;
        data: Object;
        meta: Object;
        logs: Array<Object>;
        submittedOn: ?Date;

        constructor() {
            super();

            this.attr("form")
                .model(createFormAttributeModel({ ...context, form: this }))
                .setValue({
                    parent: null,
                    revision: null
                });

            this.attr("data")
                .object()
                .setValidators("required");
            this.attr("meta")
                .model(MetaModel)
                .setValidators("required");

            this.attr("logs")
                .models(LogModel)
                .setValidators("required")
                .setValue([]);

            this.on("beforeCreate", async () => {
                this.meta.submittedOn = new Date();
            });
        }

        addLog(log: Object) {
            if (!Array.isArray(this.logs)) {
                this.logs = [];
            }

            this.logs = [...this.logs, log];
        }
    };
