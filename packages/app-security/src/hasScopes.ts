import { getIdentity, OptionsType, ResourcesType } from "./identity";

export default (scopes: ResourcesType, options: OptionsType = {}): boolean => {
    return getIdentity().hasScopes(scopes, options);
};
