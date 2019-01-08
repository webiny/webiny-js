// @flow
import { get, upperFirst } from "lodash";

export type ResourcesType = Array<string> | { [string]: Array<string> };
export type OptionsType = {
    forceBoolean?: boolean
};

class Identity {
    data: ?Object = null;
    constructor(data: ?Object) {
        this.data = data;
    }

    isLoggedIn(): boolean {
        return !!this.data;
    }

    hasFullAccess(): boolean {
        return !!get(this.data, "access.fullAccess");
    }

    getScopes(): Array<string> {
        return get(this.data, "access.scopes") || [];
    }

    hasScope(scope: string) {
        return this.getScopes().includes(scope);
    }

    hasRole(role: string) {
        return this.getRoles().includes(role);
    }

    getRoles(): Array<string> {
        return get(this.data, "access.roles") || [];
    }

    hasScopes(scopes: ResourcesType, options: OptionsType) {
        return this.__hasResources({
            type: "scope",
            resources: scopes,
            options
        });
    }

    hasRoles(roles: ResourcesType, options: OptionsType) {
        return this.__hasResources({
            type: "role",
            resources: roles,
            options
        });
    }

    __hasResources({
        type,
        resources,
        options = {}
    }: {
        type: string,
        resources: ResourcesType,
        options: OptionsType
    }): any {
        // "hasScope" or "hasRole".
        const hasResourceMethod = `has${upperFirst(type)}`;

        if (Array.isArray(resources)) {
            if (!this.isLoggedIn()) {
                return false;
            }

            if (this.hasFullAccess()) {
                return true;
            }

            for (let i = 0; i < resources.length; i++) {
                // $FlowFixMe
                if (!this[hasResourceMethod](resources[i])) {
                    return false;
                }
            }

            return true;
        }

        const result = {};
        if (!this.isLoggedIn()) {
            if (options.forceBoolean) {
                return false;
            }

            for (let key in resources) {
                result[key] = false;
            }
            return result;
        }

        if (this.hasFullAccess()) {
            if (options.forceBoolean) {
                return true;
            }

            for (let key in resources) {
                result[key] = true;
            }
            return result;
        }

        for (let key in resources) {
            result[key] = true;
            const resourcesToCheck: Array<string> = resources[key];
            for (let i = 0; i < resourcesToCheck.length; i++) {
                let resourceToCheck = resourcesToCheck[i];
                // $FlowFixMe
                if (!this[hasResourceMethod](resourceToCheck)) {
                    if (options.forceBoolean) {
                        return false;
                    }
                    result[key] = false;
                    break;
                }
            }
        }

        if (options.forceBoolean) {
            return true;
        }
        return result;
    }
}

let identity = new Identity();

export const getIdentity = () => {
    return identity;
};

export const setIdentity = (data: ?Object) => {
    identity = new Identity(data);
};
