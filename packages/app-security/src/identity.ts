import { get, upperFirst } from "lodash";

export type ResourcesType = Array<string> | { [key: string]: Array<string> };
export type OptionsType = {
    forceBoolean?: boolean;
};

class Identity {
    data = null;
    constructor(data?: { [key: string]: any }) {
        this.data = data;
    }

    isLoggedIn(): boolean {
        return !!this.data;
    }

    hasFullAccess(): boolean {
        const scopes = get(this.data, "access.scopes") || [];
        return scopes.includes("*");
    }

    getScopes(): Array<string> {
        return get(this.data, "access.scopes") || [];
    }

    hasScope(scope: string) {
        return this.getScopes().includes(scope);
    }

    hasScopes(scopes: ResourcesType, options: OptionsType) {
        return this.__hasResources({
            type: "scope",
            resources: scopes,
            options
        });
    }

    __hasResources({
        type,
        resources,
        options = {}
    }: {
        type: string;
        resources: ResourcesType;
        options: OptionsType;
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

            for (const key in resources) {
                result[key] = false;
            }
            return result;
        }

        if (this.hasFullAccess()) {
            if (options.forceBoolean) {
                return true;
            }

            for (const key in resources) {
                result[key] = true;
            }
            return result;
        }

        for (const key in resources) {
            result[key] = true;
            const resourcesToCheck: Array<string> = resources[key];
            for (let i = 0; i < resourcesToCheck.length; i++) {
                const resourceToCheck = resourcesToCheck[i];
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

export const setIdentity = data => {
    identity = new Identity(data);
};
