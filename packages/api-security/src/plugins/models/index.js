// @flow
import securityGroup from "./SecurityGroup.model";
import securityGroups2Models from "./SecurityGroups2Models.model";
import securityRole from "./SecurityRole.model";
import securityRoles2Models from "./SecurityRoles2Models.model";
import securityUser from "./SecurityUser.model";

export default config => {
    return [
        {
            name: "model-security-group",
            type: "model",
            model: securityGroup(config)
        },
        {
            name: "model-security-groups-2-models",
            type: "model",
            model: securityGroups2Models(config)
        },
        {
            name: "model-security-role",
            type: "model",
            model: securityRole(config)
        },
        {
            name: "model-security-role2-models",
            type: "model",
            model: securityRoles2Models(config)
        },
        {
            name: "model-security-user",
            type: "model",
            model: securityUser(config)
        }
    ];

    /*
    const userSettings: ModelPluginType = {
        name: "model-security-user-settings",
        type: "model",
        model: createUserSettingsModel
    };*/
};
