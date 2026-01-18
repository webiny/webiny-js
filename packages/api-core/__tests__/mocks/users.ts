import type { CreateUserInput } from "~/types/users.js";

export const users: Record<string, CreateUserInput> = {
    userA: {
        email: "user_a@yahoo.com",
        firstName: "Arabella",
        lastName: "Ricci"
    },
    userB: {
        email: "user_b@email.it",
        firstName: "Arturo",
        lastName: "Surace"
    }
};
