// @flow
import Entity from "./Entity";
import { Policy, Policies2Entities } from "./Entity";
import type { IAuthorizable } from "../../types";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 */
class Identity extends Entity implements IAuthorizable {
    constructor() {
        super();
        this.attr("policies")
            .entities(Policy, "entity")
            .setUsing(Policies2Entities, "policy");
    }
}

Identity.classId = "SecurityIdentity";

export default Identity;
