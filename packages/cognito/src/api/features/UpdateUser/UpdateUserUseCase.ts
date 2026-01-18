import { Result } from "@webiny/feature/api";
import { UpdateUserUseCase as CoreUpdateUser } from "@webiny/api-core/features/UpdateUser";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import {
    NotAuthorizedError,
    UserValidationError
} from "@webiny/api-core/features/users/shared/errors.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoUpdateUserError } from "~/api/domain/errors.js";
import { updateAdminUserValidation } from "./schema.js";
import type { UpdateAdminUserInput } from "./abstractions.js";
import { CognitoService } from "~/api/features/CognitoService/index.js";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

class UpdateUserUseCaseImpl implements UseCaseAbstraction.Interface {
    private updateAttributes: Record<string, string | MappedAttrType>;

    constructor(
        private identityContext: IdentityContext.Interface,
        private cognitoService: CognitoService.Interface,
        private updateUserUseCase: CoreUpdateUser.Interface,
        private getUserUseCase: GetUserUseCase.Interface
    ) {
        this.updateAttributes = defaultUpdateAttributes;
    }

    async execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        const permission = await this.identityContext.getPermission("adminUsers.user");
        if (!permission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validate input (including password)
        const validation = updateAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.errors[0].message));
        }

        const data = validation.data;
        const { password, ...userDataWithoutPassword } = data;

        // Get original user to know the email before update
        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const originalUser = getUserResult.value;

        // Update user in api-core
        const updateUserResult = await this.updateUserUseCase.execute(id, userDataWithoutPassword);
        if (updateUserResult.isFail()) {
            return Result.fail(updateUserResult.error);
        }

        const updatedUser = updateUserResult.value;

        // Update user in Cognito
        try {
            // Build new attributes
            const attributes: Record<string, string> = {};

            Object.keys(this.updateAttributes).forEach(attr => {
                const mappedAttr = this.updateAttributes[
                    attr as keyof typeof this.updateAttributes
                ] as MappedAttrType;
                const attrValue =
                    typeof mappedAttr === "function"
                        ? mappedAttr(updatedUser)
                        : updatedUser[mappedAttr];
                attributes[attr] = attrValue;
            });

            // If email changed, set email_verified to true
            if (originalUser.email !== updatedUser.email) {
                attributes["email_verified"] = "true";
            }

            await this.cognitoService.updateUserAttributes(
                Username.fromUser(originalUser),
                attributes
            );

            // Update password if provided
            if (password) {
                await this.cognitoService.setPermanentPassword(
                    Username.fromUser(updatedUser),
                    password
                );
            }

            return Result.ok(updatedUser);
        } catch (cognitoError) {
            return Result.fail(new CognitoUpdateUserError(cognitoError as Error));
        }
    }
}

export const UpdateUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateUserUseCaseImpl,
    dependencies: [IdentityContext, CognitoService, CoreUpdateUser, GetUserUseCase]
});
