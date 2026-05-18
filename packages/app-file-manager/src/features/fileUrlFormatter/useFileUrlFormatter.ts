import { useContainer } from "@webiny/app-admin";
import { defaultFileUrlFormatter } from "@webiny/admin-ui";
import { FileUrlFormatter } from "./abstractions.js";

export const useFileUrlFormatter = (): FileUrlFormatter.Interface => {
    const container = useContainer();
    const [formatter = null] = container.resolveAll(FileUrlFormatter);
    return formatter ?? defaultFileUrlFormatter;
};
