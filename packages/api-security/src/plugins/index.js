// @flow
import createModels from "./models";
import graphql from "./graphql";
import security from "./security";

export default ({ database }) => {
    return [createModels({ database }), graphql, security];
};
