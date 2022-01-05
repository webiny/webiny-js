import { useSecurity } from "~/hooks/useSecurity";
import { SecurityPermission } from "~/types";

export function usePermission<T extends SecurityPermission = SecurityPermission>(name: string) {
    const { getPermission } = useSecurity();
    return getPermission<T>(name);
}
