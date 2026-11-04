import type { CreateAdminUserInput } from "~/api/features/CreateUser/abstractions.js";

export const adminUsers: Record<string, CreateAdminUserInput> = {
    userA: {
        email: "admin_a@example.com",
        firstName: "Admin",
        lastName: "User A",
        password: "SecurePass123!"
    },
    userB: {
        email: "admin_b@example.com",
        firstName: "Admin",
        lastName: "User B",
        password: "SecurePass456!"
    }
};
