// @flow
import { Entity } from "webiny-api";

import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 */
class Identity extends Entity implements IAuthorizable {
    constructor() {
        super();
        this.attr("apiPermissions")
            .object()
            .setDynamic(async () => {
                const groups = await this.groups;

                const permissions = {};
                for (let i = 0; i < groups.length; i++) {
                    const groupApiPermissions = await groups[i].get("permissions.api", {});
                    for (let operationName in groupApiPermissions) {
                        if (!permissions[operationName]) {
                            permissions[operationName] = [];
                        }
                        permissions[operationName].push(groupApiPermissions[operationName]);
                    }
                }

                return permissions;
            });
    }
}

Identity.classId = "SecurityIdentity";

export default Identity;
