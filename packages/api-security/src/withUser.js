import { flow } from "lodash";
import { id } from "@commodo/fields-storage-mongodb";
import { withFields, skipOnPopulate, withHooks, withProps } from "@webiny/commodo";

export default context => baseFn => {
    return flow(
        withProps({
            getUser() {
                return context.user;
            },
            getUserId() {
                return context.user ? context.user.id : null;
            }
        }),
        withFields({
            createdBy: skipOnPopulate()(id()),
            updatedBY: skipOnPopulate()(id()),
            deletedBy: skipOnPopulate()(id())
        }),
        withHooks({
            beforeCreate() {
                this.createdBy = this.getUserId();
            },
            beforeUpdate() {
                this.updatedBy = this.getUserId();
            },
            beforeDelete() {
                this.deletedBy = this.getUserId();
            }
        })
    )(baseFn);
};
