import { flow } from "lodash";
import { withFields, skipOnPopulate, withHooks, withProps } from "@webiny/commodo";

export default context => baseFn => {
    const { id } = context.commodo.fields;

    return flow(
        withProps({
            getUser() {
                return context.security && context.security.getIdentity();
            },
            getUserId() {
                return this.getUser() && this.getUser().id;
            }
        }),
        withFields({
            createdBy: skipOnPopulate()(id()),
            updatedBy: skipOnPopulate()(id()),
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
