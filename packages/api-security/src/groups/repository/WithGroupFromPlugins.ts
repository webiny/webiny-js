import type { PluginsContainer } from "@webiny/plugins";
import type {
    GetGroupRepositoryParams,
    IGetGroupRepository
} from "./abstractions/IGetGroupRepository";
import type { Group } from "~/types";
import { SecurityRolePlugin } from "~/plugins/SecurityRolePlugin";
import { createFilter } from "./filterGroups";

export class WithGroupFromPlugins implements IGetGroupRepository {
    private plugins: PluginsContainer;
    private repository: IGetGroupRepository;

    constructor(plugins: PluginsContainer, repository: IGetGroupRepository) {
        this.plugins = plugins;
        this.repository = repository;
    }

    async execute(params: GetGroupRepositoryParams): Promise<Group | null> {
        const filterGroups = createFilter({
            tenant: params.where.tenant,
            id_in: params.where.id ? [params.where.id] : undefined,
            slug_in: params.where.slug ? [params.where.slug] : undefined
        });

        const [groupFromPlugins] = this.plugins
            .byType<SecurityRolePlugin>(SecurityRolePlugin.type)
            .map(plugin => plugin.securityRole)
            .filter(filterGroups);

        if (groupFromPlugins) {
            return groupFromPlugins;
        }

        return this.repository.execute(params);
    }
}
