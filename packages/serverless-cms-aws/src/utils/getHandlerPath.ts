import path from "path";

export const getHandlerPath = (...suffix: string[]) => {
    return path.join(__dirname, "..", "handlers", ...suffix);
};
