// @flow
import { getIdentity, type OptionsType, type ResourcesType } from "./identity";

export default (scopes: ResourcesType, options: OptionsType = {}): any => {
    return getIdentity().hasScopes(scopes, options);
};
