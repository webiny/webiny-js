// @flow
export const menuUrlValidator = (value: string) => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Menu URL must begin and end with a forward slash (`/`)");
};
