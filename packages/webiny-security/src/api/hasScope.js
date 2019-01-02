// @flow
/* eslint-disable */
import { rule } from "graphql-shield";

const list = ["api:read"];
const hasScope = scope => {
    return rule()(async (parent, args, ctx, info) => {
        return list.includes(scope);
    });
};

export default hasScope;
