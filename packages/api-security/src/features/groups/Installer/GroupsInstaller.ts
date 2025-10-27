import { AppInstaller } from "@webiny/api-tenancy/features/InstallTenant";
import { createImplementation } from "@webiny/feature/api";
import {
    CreateGroupUseCase,
    DeleteGroupUseCase,
    Group,
    ListGroupsUseCase
} from "~/features/groups/index.js";

class GroupsInstallerImpl implements AppInstaller.Interface {
    readonly alwaysRun = true;
    readonly appName = "Security";
    readonly dependsOn = [];
    private createdGroups: Group[] = [];

    constructor(
        private listGroupsUseCase: ListGroupsUseCase.Interface,
        private createGroupUseCase: CreateGroupUseCase.Interface,
        private deleteGroupUseCase: DeleteGroupUseCase.Interface
    ) {}

    async install(): Promise<void> {
        const groupsResult = await this.listGroupsUseCase.execute();
        const groups = groupsResult.value;

        if (!groups.find(g => g.slug === "full-access")) {
            const result = await this.createGroupUseCase.execute({
                name: "Full Access",
                description: "Grants full access to all apps.",
                system: true,
                slug: "full-access",
                permissions: [{ name: "*" }]
            });

            this.createdGroups.push(result.value);
        }

        if (!groups.find(g => g.slug === "anonymous")) {
            const result = await this.createGroupUseCase.execute({
                name: "Anonymous",
                description: "Permissions for anonymous users (public access).",
                system: true,
                slug: "anonymous",
                permissions: []
            });
            this.createdGroups.push(result.value);
        }
    }

    async uninstall(): Promise<void> {
        for (const group of this.createdGroups) {
            await this.deleteGroupUseCase.execute(group.id);
        }
    }
}

export const GroupInstaller = createImplementation({
    abstraction: AppInstaller,
    implementation: GroupsInstallerImpl,
    dependencies: [ListGroupsUseCase, CreateGroupUseCase, DeleteGroupUseCase]
});
