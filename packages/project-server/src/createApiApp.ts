export interface IApiApp {
    id: "api";
    name: string;
    description: string;
}

export function createApiApp(): IApiApp {
    return {
        id: "api",
        name: "API",
        description: "Represents your project's API application."
    };
}
