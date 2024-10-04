import type { PluginsContainer } from "@webiny/plugins";
import type {
    IListGroupsRepository,
    ListGroupsRepositoryParams
} from "./abstractions/IListGroupsRepository";
import type { Group } from "~/types";
import { SecurityRolePlugin } from "~/plugins/SecurityRolePlugin";
import { createFilter } from "./filterGroups";

export class WithGroupsFromPlugins implements IListGroupsRepository {
    private plugins: PluginsContainer;
    private repository: IListGroupsRepository;

    constructor(plugins: PluginsContainer, repository: IListGroupsRepository) {
        this.plugins = plugins;
        this.repository = repository;
    }

    async execute(params: ListGroupsRepositoryParams): Promise<Group[]> {
        const baseGroups = await this.repository.execute(params);

        const filterGroups = createFilter(params.where);

        const groupsFromPlugins = this.plugins
            .byType<SecurityRolePlugin>(SecurityRolePlugin.type)
            .map(plugin => plugin.securityRole)
            .filter(filterGroups);

        // We don't have to do any extra sorting because groups coming from plugins don't have `createdOn`,
        // meaning they should always be at the top of the list.
        return [...groupsFromPlugins, ...baseGroups];
    }
}
