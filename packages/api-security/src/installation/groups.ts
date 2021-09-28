import { Security, CrudOptions, Group } from "~/types";

export const attachGroupInstaller = (security: Security) => {
    const createdGroups: Group[] = [];

    const createDefaultGroups = async () => {
        const options: CrudOptions = { auth: false };
        const groups = await security.listGroups(options);

        if (!groups.find(g => g.slug === "full-access")) {
            const group = await security.createGroup(
                {
                    name: "Full Access",
                    description: "Grants full access to all apps.",
                    system: true,
                    slug: "full-access",
                    permissions: [{ name: "*" }]
                },
                options
            );

            createdGroups.push(group);
        }

        if (!groups.find(g => g.slug === "anonymous")) {
            const group = await security.createGroup(
                {
                    name: "Anonymous",
                    description: "Permissions for anonymous users (public access).",
                    system: true,
                    slug: "anonymous",
                    permissions: []
                },
                options
            );
            createdGroups.push(group);
        }
    };

    security.onInstall.subscribe(() => createDefaultGroups());

    security.onCleanup.subscribe(async () => {
        for (const group of createdGroups) {
            await security.deleteGroup(group.id);
        }
    });
};
