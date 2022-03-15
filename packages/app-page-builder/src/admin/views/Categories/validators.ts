export const categoryUrlValidator = (value: string): boolean => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Category URL must begin and end with a forward slash (`/`)");
};
