import type { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";

/**
 * Rejects a permission target that would be stored happily and then match nobody.
 *
 * A folder rule identifies a team by SLUG (`team:<slug>`) and a user by id (`admin:<userId>`) — see
 * ListFolderLevelPermissionsTargets. The field is only typed as a template string, so a team id where
 * a slug belongs is accepted and silently grants nothing. Also refuses a target the folder inherits,
 * since rewriting it as a direct rule detaches the folder from where the grant came from.
 */
export const assertTargetIsUsable = async (
    listTeams: ListTeamsUseCase.Interface,
    target: string,
    inheritedTargets: Set<string>
): Promise<void> => {
    if (inheritedTargets.has(target)) {
        throw new Error(
            `"${target}" is inherited from an ancestor folder or a role, so it cannot be changed on this folder. Change it where it is defined.`
        );
    }

    if (!target.startsWith("team:")) {
        return;
    }

    const result = await listTeams.execute();

    if (result.isFail()) {
        throw new Error(`Could not verify the teams: ${result.error.message}`);
    }

    const value = target.slice("team:".length);

    if (result.value.some(team => team.slug === value)) {
        return;
    }

    const byId = result.value.find(team => team.id === value);

    if (byId) {
        throw new Error(`"${target}" uses a team id. Use the slug instead: "team:${byId.slug}".`);
    }

    throw new Error(`"${target}" is not a known team. Call listTeams first.`);
};
