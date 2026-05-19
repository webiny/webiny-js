import { useContainer } from "@webiny/app-admin";
import { FileUrlFormatter } from "./abstractions.js";

export const useFileUrlFormatter = (): FileUrlFormatter.Interface => {
    const container = useContainer();
    return container.resolve(FileUrlFormatter);
};
