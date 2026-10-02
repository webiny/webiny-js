import { FeatureFlags } from "~/features/featureFlags/abstractions.js";
import { RawAssumePermissions } from "~/features/requestContext/abstractions.js";
import { Identity } from "~/features/security/IdentityContext/index.js";
import { RolesRepository } from "~/features/security/roles/shared/abstractions.js";
import { TeamsRepository } from "~/features/security/teams/shared/abstractions.js";
import { getPermissionsFromRoles } from "~/features/security/utils/getPermissionsFromRoles.js";
import type { SecurityRole } from "~/types/security.js";
import { PermissionsProcessor } from "./abstractions.js";

function grantsFullAccess(permissions: PermissionsProcessor.Permissions): boolean {
    return permissions.some(permission => permission.name === "*");
}

/**
 * Evaluates the request against a role or team the caller asked to preview, instead of against the
 * caller's own roles. This is what makes "view the Admin as an Editor" honest: lists shrink and
 * writes fail server-side, rather than the Admin merely hiding buttons over unrestricted data.
 *
 * Previewing is available only to callers who already have full access, and it can only ever take
 * permissions away. See the guard in `getPermissions` for why the check cannot go through
 * IdentityContext.
 */
class AssumedPermissionsImpl implements PermissionsProcessor.Interface {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private rolesRepository: RolesRepository.Interface,
        private teamsRepository: TeamsRepository.Interface,
        private decoratee: PermissionsProcessor.Interface
    ) {}

    async getPermissions(identity: Identity): Promise<PermissionsProcessor.Permissions | null> {
        const target = this.rawAssumePermissions.get();
        const own = await this.decoratee.getPermissions(identity);

        if (!target) {
            return own;
        }

        /*
         * The guard runs against the caller's OWN permissions, and they have to come from the
         * decoratee. IdentityContext.hasFullAccess() would resolve them through the Authorizer,
         * which lands back in this decorator, so the check would be re-entrant. Order matters too:
         * read the real permissions, verify them, and only then substitute.
         */
        if (!own || !grantsFullAccess(own)) {
            return own;
        }

        const roles = await this.loadAssumedRoles(target);

        /*
         * A preview request that resolves to no roles grants nothing. Falling back to `own` would
         * hand the caller their real full access while the Admin still claims they are previewing
         * a restricted role, which is the one outcome this feature must never produce.
         */
        return getPermissionsFromRoles(roles);
    }

    private async loadAssumedRoles(target: RawAssumePermissions.Target): Promise<SecurityRole[]> {
        if (target.type === "role") {
            return this.loadRoles([target.id]);
        }

        const teamsEnabled = this.featureFlags.get().isEnabled("advancedAccessControlLayer.teams");
        if (!teamsEnabled) {
            return [];
        }

        const teamResult = await this.teamsRepository.get({ id: target.id });
        if (teamResult.isFail()) {
            return [];
        }

        return this.loadRoles(teamResult.value.roles);
    }

    private async loadRoles(roleIds: string[]): Promise<SecurityRole[]> {
        if (roleIds.length === 0) {
            return [];
        }

        const result = await this.rolesRepository.list({ where: { id_in: roleIds } });
        if (result.isFail()) {
            return [];
        }

        return result.value;
    }
}

export const AssumedPermissions = PermissionsProcessor.createDecorator({
    decorator: AssumedPermissionsImpl,
    dependencies: [RawAssumePermissions, FeatureFlags, RolesRepository, TeamsRepository]
});
