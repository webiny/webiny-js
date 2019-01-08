// @flow
import { getIdentity, type OptionsType, type ResourcesType } from "./identity";

export default (roles: ResourcesType, options: OptionsType = {}): any => {
    return getIdentity().hasRoles(roles, options);
};
