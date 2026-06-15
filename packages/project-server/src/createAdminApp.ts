export interface IAdminApp {
    id: "admin";
    name: string;
    description: string;
}

export function createAdminApp(): IAdminApp {
    return {
        id: "admin",
        name: "Admin",
        description: "Your project's admin area."
    };
}
