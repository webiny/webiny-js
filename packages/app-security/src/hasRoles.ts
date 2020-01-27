import { getIdentity, OptionsType, ResourcesType } from "./identity";

export default (roles: ResourcesType, options: OptionsType = {}): boolean => {
    return getIdentity().hasRoles(roles, options);
};
