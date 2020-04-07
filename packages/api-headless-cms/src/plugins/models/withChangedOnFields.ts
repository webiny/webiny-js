import { validation } from "@webiny/validation";
import { pipe, withFields, date, skipOnPopulate, onSet } from "@webiny/commodo";

export default () =>
    withFields(instance => ({
        changedOn: pipe(
            skipOnPopulate(),
            onSet(value => {
                if (value !== instance.changedOn) {
                    const removeCallback = instance.hook("afterSave", async () => {
                        removeCallback();
                        await instance.hook("afterChange");
                    });
                }

                return value;
            })
        )(date({ validation: validation.create("required"), value: new Date() }))
    }));
