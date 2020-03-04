import { flow } from "lodash";
import { withFields, withName, withHooks } from "@webiny/commodo";

export default ({ createBase }) => {
    // TODO: add proper Model type once Commodo is migrated to TS
    const MyModel: any = flow(
        withName("MyModel"),
        withFields(instance => ({
            /* ... Fields ... */
        })),
        withHooks({
            async beforeCreate() {
                /* ... */
            },
            async beforeDelete() {
                /* ... */
            }
        })
    )(createBase());

    return MyModel;
};
