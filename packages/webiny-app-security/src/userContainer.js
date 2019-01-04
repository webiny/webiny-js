// @flow
const container: {
    user: ?Object
} = {
    user: null
};

export const getUser = () => {
    return container.user;
};

export const setUser = (user: ?Object) => {
    container.user = user;
};
