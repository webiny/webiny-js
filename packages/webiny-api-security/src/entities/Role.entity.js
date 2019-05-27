// @flow
import { Entity } from "webiny-entity";

export interface IRole extends Entity {
    createdBy: ?string;
    name: string;
    slug: string;
    system: string;
    description: string;
    scopes: Array<string>;
}

export function roleFactory(context: Object): Class<IRole> {
    return class Role extends Entity {
        static classId = "SecurityRole";

        createdBy: ?string;
        name: string;
        slug: string;
        system: string;
        description: string;
        scopes: Array<string>;

        constructor() {
            super();

            const { user = {} } = context;

            this.attr("createdBy").char();
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("slug")
                .char()
                .setValidators("required")
                .setOnce();

            this.attr("description").char();
            this.attr("system").boolean();

            this.attr("scopes").array();

            this.on("beforeCreate", async () => {
                this.createdBy = user ? user.id : null;
                const existingRole = await Role.findOne({ query: { slug: this.slug } });
                if (existingRole) {
                    throw Error(`Role with slug "${this.slug}" already exists.`);
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
