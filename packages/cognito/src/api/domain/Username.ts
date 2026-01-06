import type { AdminUser, CreateUserInput } from "@webiny/api-core/features/users/shared/types.js";

export class Username {
    static fromUser(user: AdminUser | CreateUserInput) {
        return user.email.toLowerCase();
    }
}
