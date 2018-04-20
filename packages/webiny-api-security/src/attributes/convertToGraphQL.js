// @flow
import { GraphQLString } from "graphql";
import type { AttributeToTypeParams } from "webiny-api/types";
import PasswordAttribute from "./passwordAttribute";
import IdentityAttribute from "./identityAttribute";

/**
 * This function converts security attributes into GraphQL compatible types
 * @param params
 * @returns {{type,resolve} || null}
 */

export default (params: AttributeToTypeParams) => {
    const { attr, schema } = params;

    let type = null;
    let resolve = null;

    if (attr instanceof PasswordAttribute) {
        type = GraphQLString;
    }

    if (attr instanceof IdentityAttribute) {
        type = schema.getType("IdentityType");
    }

    return type ? { type, resolve } : null;
};
