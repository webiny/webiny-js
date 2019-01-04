// @flow
import { Entity } from "webiny-entity";

export class Role extends Entity {
    createdBy: ?string;
    name: string;
    slug: string;
    description: string;
    scopes: Array<string>;
}

Role.classId = "SecurityRole";
Role.storageClassId = "Security_Roles";

export function roleFactory({ user = {} }: Object) {
    return class extends Role {
        constructor() {
            super();
            this.attr("createdBy").char();
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("slug")
                .char()
                .setValidators("required")
                .setOnce();

            this.attr("description").char();

            this.attr("scopes").array();

            this.on("beforeCreate", async () => {
                this.createdBy = user ? user.id : null;
                const existingRole = await Role.findOne({ query: { slug: this.slug } });
                if (existingRole) {
                    throw Error(`Role with slug "${this.slug}" already exists.`);
                }
            });
        }
    };
}
