import { Result } from "@webiny/feature/api";
import { UpdateUserUseCase } from "@webiny/api-core/features/UpdateUser";
import { GetUserUseCase } from "@webiny/api-core/features/GetUser";
import { UserValidationError } from "@webiny/api-core/features/users/shared/errors.js";
import { UpdateAdminUserUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CognitoService } from "../shared/abstractions.js";
import { Username } from "~/api/domain/Username.js";
import { CognitoUpdateUserError } from "~/api/domain/errors.js";
import { updateAdminUserValidation } from "./schema.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import type { UpdateAdminUserInput } from "./abstractions.js";

type MappedAttrType = (user: AdminUser) => string | keyof AdminUser;

const defaultUpdateAttributes = {
    family_name: "lastName",
    given_name: "firstName",
    preferred_username: "email"
};

class UpdateAdminUserUseCaseImpl implements UseCaseAbstraction.Interface {
    private updateAttributes: Record<string, string | MappedAttrType>;

    constructor(
        private cognitoService: CognitoService.Interface,
        private updateUserUseCase: UpdateUserUseCase.Interface,
        private getUserUseCase: GetUserUseCase.Interface
    ) {
        this.updateAttributes = defaultUpdateAttributes;
    }

    async execute(
        id: string,
        input: UpdateAdminUserInput
    ): Promise<Result<AdminUser, UseCaseAbstraction.Error>> {
        // 1. Validate input (including password)
        const validation = updateAdminUserValidation.safeParse(input);
        if (!validation.success) {
            return Result.fail(new UserValidationError(validation.error.errors[0].message));
        }

        const data = validation.data;
        const { password, ...userDataWithoutPassword } = data;

        // 2. Get original user to know the email before update
        const getUserResult = await this.getUserUseCase.execute({ id });
        if (getUserResult.isFail()) {
            return Result.fail(getUserResult.error);
        }

        const originalUser = getUserResult.value;


        // 3. Update user in api-core
        const updateUserResult = await this.updateUserUseCase.execute(id, userDataWithoutPassword);
        if (updateUserResult.isFail()) {
            return Result.fail(updateUserResult.error);
        }

        const updatedUser = updateUserResult.value;

        // 4. Update user in Cognito
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

            // 5. Update password if provided
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

export const UpdateAdminUserUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateAdminUserUseCaseImpl,
    dependencies: [CognitoService, UpdateUserUseCase, GetUserUseCase]
});
