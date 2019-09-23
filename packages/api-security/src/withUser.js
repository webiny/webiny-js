import { withProps } from "repropose";
import { withHooks } from "@commodo/hooks";
import { withFields } from "@commodo/fields";
import { flow } from "lodash";
import { id } from "@commodo/fields-storage-mongodb";

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
            createdBy: id(),
            updatedBY: id(),
            deletedBy: id()
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
