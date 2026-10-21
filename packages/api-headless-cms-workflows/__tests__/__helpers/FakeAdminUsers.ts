import { Result } from "@webiny/feature/api";
import type { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import type { GetUserInput } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { UserNotFoundError } from "@webiny/api-core/features/users/shared/errors.js";

/**
 * Admin users of the current tenant by id, for `CandidateReadAccess` (R68). The fake replaces only
 * the use case: the authorizers still find no stored user, so `TestAuthorizer` grants each user
 * what `permissionsByIdentity` lists. Register with
 * `container.registerInstance(GetUserUseCase, new FakeAdminUsers([...ids]))`.
 */
export class FakeAdminUsers implements GetUserUseCase.Interface {
    public constructor(private userIds: string[]) {}

    public async execute(input: GetUserInput): Promise<Result<AdminUser, GetUserUseCase.Error>> {
        const id = input.id ?? "";
        if (!this.userIds.includes(id)) {
            return Result.fail(new UserNotFoundError(id));
        }
        return Result.ok({
            id,
            displayName: id,
            email: `${id}@webiny.test`,
            tenant: "root",
            createdOn: "2026-10-01T00:00:00.000Z",
            createdBy: null
        });
    }
}
