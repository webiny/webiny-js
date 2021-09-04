import { CrudOptions, Group, Installable, InstallableParams } from "../types";
import { Security } from "../Security";

export class GroupsInstaller implements Installable {
    private _created: Group[] = [];

    async install({ security }: InstallableParams): Promise<void> {
        await this.createDefaultGroups(security);
    }

    async cleanup({ security }: InstallableParams): Promise<void> {
        for (const group of this._created) {
            await security.groups.deleteGroup(group.slug);
        }
    }

    private async createDefaultGroups(security: Security): Promise<void> {
        const options: CrudOptions = { auth: false };
        const groups = await security.groups.listGroups(options);

        if (!groups.find(g => g.slug === "full-access")) {
            const group = await security.groups.createGroup(
                {
                    name: "Full Access",
                    description: "Grants full access to all apps.",
                    system: true,
                    slug: "full-access",
                    permissions: [{ name: "*" }]
                },
                options
            );

            this._created.push(group);
        }

        if (!groups.find(g => g.slug === "anonymous")) {
            const group = await security.groups.createGroup(
                {
                    name: "Anonymous",
                    description: "Permissions for anonymous users (public access).",
                    system: true,
                    slug: "anonymous",
                    permissions: []
                },
                options
            );
            this._created.push(group);
        }
    }
}
