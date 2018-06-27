// @flow
import { Entity, Policy, Policies2Entities } from "./Entity";

/**
 * Identity class is the base class for all identity classes.
 * It is used to create your API user classes.
 */
class Identity extends Entity {
    constructor() {
        super();
        this.attr("policies")
            .entities(Policy, "entity")
            .setUsing(Policies2Entities, "policy");
    }
}

Identity.classId = "SecurityIdentity";

export default Identity;
