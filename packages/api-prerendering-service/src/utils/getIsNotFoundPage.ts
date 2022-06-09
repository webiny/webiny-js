import { Args } from "~/types";

export const getIsNotFoundPage = (args: Args): boolean => {
    return args?.configuration?.meta?.notFoundPage || false;
};
