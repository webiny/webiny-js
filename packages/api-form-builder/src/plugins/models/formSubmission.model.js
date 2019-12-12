// @flow
import { flow } from "lodash";
import { validation } from "@webiny/validation";
import {
    withFields,
    object,
    string,
    skipOnPopulate,
    fields,
    date,
    ref,
    withHooks,
    withName,
    withProps
} from "@webiny/commodo";

export default ({ createBase, Form }) => {
    return flow(
        withName("FormSubmission"),
        withFields(instance => ({
            form: fields({
                instanceOf: withFields({
                    parent: ref({
                        parent: instance,
                        instanceOf: Form,
                        validation: validation.create("required")
                    }),
                    revision: ref({
                        parent: instance,
                        instanceOf: Form,
                        validation: validation.create("required")
                    })
                })()
            }),
            data: object({ validation: validation.create("required") }),
            meta: fields({
                instanceOf: withFields({
                    ip: string({ validation: validation.create("required") }),
                    locale: string({ validation: validation.create("required") }),
                    submittedOn: skipOnPopulate()(
                        date({ validation: validation.create("required") })
                    )
                })()
            }),
            logs: fields({
                list: true,
                value: [],
                instanceOf: withFields({
                    type: string({
                        validation: validation.create("required,in:error:warning:info:success"),
                        message: string(),
                        data: object(),
                        createdOn: date({ value: new Date() })
                    })
                })()
            })
        })),
        withHooks({
            beforeCreate() {
                this.meta.submittedOn = new Date();
            }
        }),
        withProps({
            addLog(log) {
                if (!Array.isArray(this.logs)) {
                    this.logs = [];
                }

                this.logs = [...this.logs, log];
            }
        })
    )(createBase());
};
