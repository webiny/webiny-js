// @flow
import { type ModelPluginType } from "webiny-api/types";
import {
    SecurityGroup,
    SecurityGroups2Entities,
    SecurityRole,
    SecurityRoles2Entities,
    SecurityUser
} from "webiny-api-security/models";

export default ([
    {
        name: "model-security-role",
        type: "model",
        model: SecurityRole
    },
    {
        name: "model-security-role-2-entities",
        type: "model",
        model: SecurityRoles2Entities
    },
    {
        name: "model-security-group",
        type: "model",
        model: SecurityGroup
    },
    {
        name: "model-security-groups-2-entities",
        type: "model",
        model: SecurityGroups2Entities
    },
    {
        name: "model-security-user",
        type: "model",
        model: SecurityUser
    }
]: Array<ModelPluginType>);
