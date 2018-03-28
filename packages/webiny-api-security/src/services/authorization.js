// @flow
import type { IAuthorization, IAuthorizable } from "../../types";
import type { ApiMethod } from "webiny-api";
import AuthorizationError from "./authorizationError";

class Authorization implements IAuthorization {
    /**
     * Checks whether user can execute an API method.
     * @param {ApiMethod} apiMethod
     * @param {IAuthorizable} authorizable
     * @returns {Promise<boolean>}
     */
    async canExecute(apiMethod: ApiMethod, authorizable: IAuthorizable): Promise<boolean> {
        if (apiMethod.isPublic()) {
            return true;
        }

        const endpointClassId = apiMethod.getEndpoint().constructor.classId;
        const method = apiMethod.getName();

        const authorizationError = new AuthorizationError(
            `Not authorized to execute ${method} on ${endpointClassId}`,
            AuthorizationError.NOT_AUTHORIZED
        );

        if (!authorizable) {
            throw authorizationError;
        }

        const roles = await authorizable.getRoles();
        for (let i = 0; i < roles.length; i++) {
            const permissions = await roles[i].permissions;
            for (let j = 0; j < permissions.length; j++) {
                const { rules } = permissions[j];
                for (let k = 0; k < rules.length; k++) {
                    const rule = rules[k];
                    if (rule.classId === endpointClassId) {
                        for (let l = 0; l < rule.methods.length; l++) {
                            if (rule.methods[l].method === method) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        throw authorizationError;
    }
}

export default Authorization;
