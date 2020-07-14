import { flow } from "lodash";
import { withProps } from "@webiny/commodo";

export default context => baseFn => {
    return flow(
        withProps({
            getUser() {
                return context.user;
            },
            getUserId() {
                return context.user ? context.user.id : null;
            }
        })
    )(baseFn);
};
