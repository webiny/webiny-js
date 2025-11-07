import { createIdentity } from "~tests/helpers/identity";

export const createGetIdentity = () => {
    return () => {
        return createIdentity();
    };
};
