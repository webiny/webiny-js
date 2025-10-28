import type { Container } from "@webiny/di-container";
import type { Team } from "~/types/security.js";
import type {
    AdminUsers,
    AdminUser,
    CreateUserInput,
    UpdateUserInput,
    GetUserParams,
    ListUsersParams
} from "~/types/users.js";
import { GetUserUseCase } from "~/features/users/GetUser/index.js";
import { ListUsersUseCase } from "~/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "~/features/users/ListUserTeams/index.js";
import { CreateUserUseCase } from "~/features/users/CreateUser/index.js";
import { UpdateUserUseCase } from "~/features/users/UpdateUser/index.js";
import { DeleteUserUseCase } from "~/features/users/DeleteUser/index.js";

export class LegacyContext implements AdminUsers {
    constructor(private container: Container) {}

    async getUser<TUser extends AdminUser = AdminUser>(params: GetUserParams): Promise<TUser> {
        const useCase = this.container.resolve(GetUserUseCase);
        const result = await useCase.execute({
            id: params.where.id,
            email: params.where.email
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value as TUser;
    }

    async listUsers<TUser extends AdminUser = AdminUser>(
        params?: ListUsersParams
    ): Promise<TUser[]> {
        const useCase = this.container.resolve(ListUsersUseCase);
        const result = await useCase.execute(params);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value as TUser[];
    }

    async listUserTeams(id: string): Promise<Team[]> {
        const useCase = this.container.resolve(ListUserTeamsUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }

    async createUser<TUser extends AdminUser = AdminUser>(data: CreateUserInput): Promise<TUser> {
        const useCase = this.container.resolve(CreateUserUseCase);
        const result = await useCase.execute(data);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value as TUser;
    }

    async updateUser<TUser extends AdminUser = AdminUser>(
        id: string,
        data: UpdateUserInput
    ): Promise<TUser> {
        const useCase = this.container.resolve(UpdateUserUseCase);
        const result = await useCase.execute(id, data);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value as TUser;
    }

    async deleteUser(id: string): Promise<void> {
        const useCase = this.container.resolve(DeleteUserUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }
    }
}
