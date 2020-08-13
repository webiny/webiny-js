import { flow } from "lodash";
import { withFields, skipOnPopulate, withHooks, withProps, string } from "@webiny/commodo";

export const withUser = (context) => (baseFn) => {
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
            createdBy: skipOnPopulate()(string()),
            updatedBy: skipOnPopulate()(string()),
            deletedBy: skipOnPopulate()(string())
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
