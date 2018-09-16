// @flow
import { GraphQLObjectType } from "graphql";
import type { Schema } from "../../graphql";

import {
    GroupType,
    GroupQueryType,
    GroupQueryField,
    PolicyType,
    PolicyQueryType,
    PolicyQueryField
} from "../../entities/Entity/Entity.graphql";
import {
    ApiTokenType,
    ApiTokenQueryType,
    ApiTokenQueryField
} from "../../entities/ApiToken/ApiToken.graphql";
import { UserType, UserQueryType, UserQueryField } from "../../entities/User/User.graphql";

export default (schema: Schema) => {
    // Add types to schema
    schema.addType(ApiTokenType);
    schema.addType(ApiTokenQueryType);
    schema.addType(UserType);
    schema.addType(UserQueryType);
    schema.addType(GroupType);
    schema.addType(GroupQueryType);
    schema.addType(PolicyType);
    schema.addType(PolicyQueryType);

    // Create Security field to group security related queries
    const SecurityType = new GraphQLObjectType({
        name: "Security",
        fields: () => ({
            ApiTokens: ApiTokenQueryField(),
            Users: UserQueryField(),
            Groups: GroupQueryField(),
            Policies: PolicyQueryField()
        })
    });

    schema.addType(SecurityType);

    schema.addQueryField({
        name: "Security",
        type: SecurityType,
        resolve() {
            return SecurityType;
        }
    });
};
