export const menuUrlValidator = (value: string): boolean => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Menu URL must begin and end with a forward slash (`/`)");
};
