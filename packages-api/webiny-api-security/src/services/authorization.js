import type { IAuthorization, IAuthorizable } from "../../types";
import type { ApiMethod } from "webiny-api";
import _find from "lodash/fp/find";

class Authorization implements IAuthorization {
    /**
     * Checks whether user can execute an API method.
     * @param {ApiMethod} apiMethod
     * @param {IAuthorizable} authorizable
     * @returns {boolean}
     */
    async canExecute(apiMethod: ApiMethod, authorizable: IAuthorizable): Promise<boolean> {
        const endpointClassId = apiMethod.getEndpoint().classId;
        const method = apiMethod.getName();
        const roles = await authorizable.getRoles();
        for (let i = 0; i < roles.length; i++) {
            const permissions = await roles[i].permissions;
            for (let j = 0; j < permissions.length; j++) {
                const { rules } = permissions[j];
                for (let k = 0; k < rules.length; k++) {
                    const rule = rules[k];
                    if (rule.classId === endpointClassId && _find(rule.methods, { method })) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

export default Authorization;
