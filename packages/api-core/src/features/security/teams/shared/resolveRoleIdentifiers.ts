import { Result } from "@webiny/feature/api";
import { RolesRepository } from "../../roles/shared/abstractions.js";
import { TeamValidationError } from "./errors.js";

/**
 * Maps whatever a caller used to name a role onto the role IDs a team stores.
 *
 * `team.roles` holds IDs and only IDs: GetPermissionsFromIdentity resolves them with `id_in` against
 * the roles repository. A slug stored here matches nothing, so the team is created, reads correctly
 * in the admin UI, and grants no permissions at all. Nothing previously caught that, because the
 * field is typed `string[]` and the use case wrote it through untouched.
 *
 * Accepting both forms rather than rejecting slugs: which identifier a given field wants is not
 * guessable from the outside, and a few lines away in the same area a team is identified by SLUG
 * (folder permission targets are `team:<slug>`). An identifier that is neither is a genuine mistake
 * and is reported.
 */
export const resolveRoleIdentifiers = async (
    rolesRepository: RolesRepository.Interface,
    identifiers: string[]
): Promise<Result<string[], TeamValidationError>> => {
    if (identifiers.length === 0) {
        return Result.ok([]);
    }

    /*
     * Every role, in one read. `id_in` and `slug_in` are ANDed by the repository, so they cannot
     * express "either of these", and a project has few enough roles for the distinction not to
     * matter. Plugin-defined roles are included, which a filtered query would also have to cover.
     */
    const rolesResult = await rolesRepository.list({});

    if (rolesResult.isFail()) {
        return Result.fail(new TeamValidationError(`Could not load roles: ${rolesResult.error}`));
    }

    const byId = new Map(rolesResult.value.map(role => [role.id, role.id]));
    const bySlug = new Map(rolesResult.value.map(role => [role.slug, role.id]));

    const unknown: string[] = [];

    // ID first, so a slug that happens to equal another role's ID cannot shadow it.
    const roleIds = identifiers.map(identifier => {
        const resolved = byId.get(identifier) ?? bySlug.get(identifier);

        if (!resolved) {
            unknown.push(identifier);
            return identifier;
        }

        return resolved;
    });

    if (unknown.length > 0) {
        const names = unknown.map(identifier => `"${identifier}"`).join(", ");
        return Result.fail(new TeamValidationError(`Not a known role id or slug: ${names}.`));
    }

    return Result.ok(roleIds);
};
