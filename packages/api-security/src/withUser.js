import { withProps } from "repropose";

export default context => baseFn => {
    return withProps({
        getUser() {
            return context.user;
        },
        getUserId() {
            return context.user ? context.user.id : null;
        }
    })(baseFn);
};
