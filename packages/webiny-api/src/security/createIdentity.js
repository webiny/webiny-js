// @flow
import addDays from "date-fns/add_days";
import { Identity } from "./../entities";

type IdentityOptions = {
    strategy?: Object,
    expiresOn?: Function,
    field?: string,
    type?: string
};

export default (entity: typeof Identity, options: IdentityOptions = {}) => {
    const identity: { identity: typeof Identity, authenticate: null | Array<Object> } = {
        identity: entity,
        authenticate: null
    };

    if (options && options.strategy) {
        identity.authenticate = [
            {
                expiresOn: args => addDays(new Date(), args.remember ? 30 : 1),
                field: "authenticate",
                ...options
            }
        ];
    }

    return identity;
};
