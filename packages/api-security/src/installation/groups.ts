import type { Security, Group } from "~/types.js";

export const attachGroupInstaller = (security: Security): void => {
    const createdGroups: Group[] = [];

    const createDefaultGroups = async () => {
        const groups = await security.listGroups();

        if (!groups.find(g => g.slug === "full-access")) {
            const group = await security.createGroup({
                name: "Full Access",
                description: "Grants full access to all apps.",
                system: true,
                slug: "full-access",
                permissions: [{ name: "*" }]
            });

            createdGroups.push(group);
        }

        if (!groups.find(g => g.slug === "anonymous")) {
            const group = await security.createGroup({
                name: "Anonymous",
                description: "Permissions for anonymous users (public access).",
                system: true,
                slug: "anonymous",
                permissions: []
            });
            createdGroups.push(group);
        }
    };

    // TODO: move group creation into the installer itself.
    // security.onInstall.subscribe(() => createDefaultGroups());

    // security.onCleanup.subscribe(async () => {
    //     for (const group of createdGroups) {
    //         await security.deleteGroup(group.id);
    //     }
    // });
};
