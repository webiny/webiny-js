import type { CreateUserInput } from "~/types/users.js";

export const users: Record<string, CreateUserInput> = {
    userA: {
        email: "user_a@yahoo.com",
        firstName: "Arabella",
        lastName: "Ricci",
        password: "12345678"
    },
    userB: {
        email: "user_b@email.it",
        firstName: "Arturo",
        lastName: "Surace",
        password: "23456789"
    }
};
