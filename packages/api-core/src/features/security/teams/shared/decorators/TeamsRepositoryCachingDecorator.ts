import { Result } from "@webiny/feature/api";
import { TeamsRepository } from "../abstractions.js";
import type { Team, GetTeamInput, ListTeamsInput } from "../types.js";
import { ListCache } from "~/features/security/roles/shared/decorators/ListCache.js";

class TeamsRepositoryCachingDecoratorImpl implements TeamsRepository.Interface {
    private readonly cache = new ListCache<Team>();

    constructor(private decoratee: TeamsRepository.Interface) {}

    async get(params: GetTeamInput): Promise<Result<Team, TeamsRepository.Error>> {
        // Check cache first
        if (this.cache.hasItems()) {
            const cachedTeam = this.cache.getItems().find(t => {
                if (params.id && t.id === params.id) {
                    return true;
                }
                if (params.slug && t.slug === params.slug) {
                    return true;
                }
                return false;
            });

            if (cachedTeam) {
                return Result.ok(cachedTeam);
            }
        }

        // Delegate to decoratee
        const result = await this.decoratee.get(params);

        // Add to cache on success
        if (result.isOk()) {
            this.cache.addItems([result.value]);
        }

        return result;
    }

    async list(params: ListTeamsInput): Promise<Result<Team[], TeamsRepository.Error>> {
        return this.decoratee.list(params);
    }

    async create(team: Team): Promise<Result<void, TeamsRepository.Error>> {
        const result = await this.decoratee.create(team);

        // Add to cache on success
        if (result.isOk()) {
            this.cache.addItems([team]);
        }

        return result;
    }

    async update(team: Team): Promise<Result<void, TeamsRepository.Error>> {
        const result = await this.decoratee.update(team);

        // Update in cache on success
        if (result.isOk()) {
            this.cache.updateItems(item => {
                if (item.id === team.id) {
                    return team;
                }
                return item;
            });
        }

        return result;
    }

    async delete(team: Team): Promise<Result<void, TeamsRepository.Error>> {
        const result = await this.decoratee.delete(team);

        // Remove from cache on success
        if (result.isOk()) {
            this.cache.removeItems(item => item.id === team.id);
        }

        return result;
    }
}

export const TeamsRepositoryCachingDecorator = TeamsRepository.createDecorator({
    decorator: TeamsRepositoryCachingDecoratorImpl,
    dependencies: []
});
