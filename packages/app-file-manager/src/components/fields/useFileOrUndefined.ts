import { useFile } from "~/hooks/useFile";

export function useFileOrUndefined() {
    try {
        return useFile();
    } catch (err) {
        return { file: undefined };
    }
}
