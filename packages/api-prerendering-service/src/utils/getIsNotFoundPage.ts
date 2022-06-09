import { Args} from "~/types";

export default (args: Args): boolean => {
    return args?.configuration?.meta?.notFoundPage || false;
};
