import { useMemo } from "react";
import { useLocation } from "@webiny/react-router";

export function useQuery() {
    const { search } = useLocation();

    return useMemo(() => new URLSearchParams(search), [search]);
}
