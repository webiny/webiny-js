import { z } from "zod";
import { Result } from "@webiny/feature/api";
import { AdminUsersRepository } from "@webiny/api-core/features/users/shared/abstractions.js";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CreateUserUseCase as CoreCreateUser } from "@webiny/api-core/features/users/CreateUser/index.js";
import { FindUserRecordsUseCase } from "@webiny/api-core/features/users/FindUserRecords/index.js";
import { LinkUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import {
    CognitoAccountExistsError,
    CognitoAccountNotFoundError,
    CognitoGetUserError
} from "~/api/domain/errors.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

const linkAdminUserValidation = z.object({
    email: z.string().email(),
    roles: z.array(z.string()).optional().default([]),
    teams: z.array(z.string()).optional().default([])
});

class LinkUserUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private cognitoService: CognitoService.Interface,
        private createUserUseCase: CoreCreateUser.Interface,
        private findUserRecords: FindUserRecordsUseCase.Interface,
        private repository: AdminUsersRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        const validation = linkAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.issues[0].message));
        }

        const { email, roles, teams } = validation.data;

        const existingUserResult = await this.repository.get({ email });
        if (existingUserResult.isOk()) {
            return Result.fail(new CognitoAccountExistsError(email));
        }

        let cognitoUser: CognitoService.User | null;
        try {
            cognitoUser = await this.cognitoService.getUser(Username.fromUser({ email }));
        } catch (error) {
            return Result.fail(new CognitoGetUserError(error as Error));
        }

        if (!cognitoUser) {
            return Result.fail(new CognitoAccountNotFoundError(email));
        }

        const id = cognitoUser.attributes["custom:id"];
        if (!id) {
            // Not an account this app created, so there's no user ID to share.
            return Result.fail(new CognitoAccountExistsError(email));
        }

        // Exhaustive, so records from before the user→tenant index get indexed now.
        const recordsResult = await this.findUserRecords.execute(id, { exhaustive: true });
        if (recordsResult.isFail()) {
            return Result.fail(recordsResult.error);
        }

        const records = recordsResult.value;
        const currentTenant = this.tenantContext.getTenant().id;
        if (records.some(record => record.tenant === currentTenant)) {
            return Result.fail(new CognitoAccountExistsError(email));
        }

        // Name, email and avatar are global per person, so they come from the person's other
        // records, or from the account.
        const [existing] = records;
        const firstName = existing?.firstName ?? cognitoUser.attributes["given_name"];
        const lastName = existing?.lastName ?? cognitoUser.attributes["family_name"];

        return this.createUserUseCase.execute({
            id,
            email: existing?.email ?? email,
            firstName,
            lastName,
            displayName: existing?.displayName,
            avatar: existing?.avatar,
            roles,
            teams
        });
    }
}

export const LinkUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: LinkUserUseCaseImpl,
    dependencies: [
        IdentityContext,
        TenantContext,
        CognitoService,
        CoreCreateUser,
        FindUserRecordsUseCase,
        AdminUsersRepository
    ]
});
