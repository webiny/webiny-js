// @flow
import { Entity } from "webiny-api";
import Group from "./group.entity";

import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 *
 * @property {EntityCollection<Group>} groups
 */
class Identity extends Entity implements IAuthorizable {
    constructor() {
        super();
        this.attr("groups")
            .entities(Group)
            .setToStorage();
    }

    /**
     * Checks whether the user has the specified group.
     * @param {string} group
     * @returns {boolean}
     */
    // eslint-disable-next-line
    async hasGroup(group: string): Promise<boolean> {
        const groups = await this.groups;
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].slug === group) {
                return true;
            }
        }
        return false;
    }
}

Identity.classId = "SecurityIdentity";

export default Identity;
