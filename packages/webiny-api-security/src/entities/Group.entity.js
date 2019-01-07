// @flow
import { Entity } from "webiny-entity";
import type { Role } from "./Role.entity";

export class Group extends Entity {
    name: string;
    slug: string;
    description: string;
    system: boolean;
    roles: Promise<Array<Role>>;
}

Group.classId = "SecurityGroup";
Group.storageClassId = "Security_Groups";

export function groupFactory({ user = {}, security: { entities } }: Object) {
    return class extends Group {
        constructor() {
            super();
            this.attr("createdBy")
                .char()
                .setDefaultValue(user.id);
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("slug")
                .char()
                .setValidators("required")
                .setOnce();

            this.attr("description").char();
            this.attr("system").boolean();

            this.attr("roles")
                .entities(entities.Role, "entity")
                .setUsing(entities.Roles2Entities, "role");

            this.on("beforeCreate", async () => {
                const existingGroup = await Group.findOne({ query: { slug: this.slug } });
                if (existingGroup) {
                    throw Error(`Group with slug "${this.slug}" already exists.`);
                }
            });

            this.on("beforeDelete", async () => {
                if (this.system) {
                    throw Error(`Cannot delete system role.`);
                }
            });
        }
    };
}
