import { useCallback } from "react";
import { useParentProperty } from "~/Properties";

export function useIdGenerator(name: string) {
    const parentProperty = useParentProperty();

    return useCallback(
        (...parts: string[]) => {
            return [parentProperty?.id, name, ...parts].filter(Boolean).join(":");
        },
        [name, parentProperty]
    );
}
