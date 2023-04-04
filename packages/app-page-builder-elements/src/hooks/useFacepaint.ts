import { useMemo } from "react";
import facepaint, { type DynamicStyleFunction } from "facepaint";
import { usePageElements } from "~/hooks/usePageElements";

export const useFacepaint: typeof facepaint = (...args) => {
    return useMemo(() => facepaint(...args), [JSON.stringify(args)]);
};

export const mq = (...args: Parameters<DynamicStyleFunction>) => {
    const { theme } = usePageElements();
    const facepaint = useFacepaint(Object.values(theme.breakpoints));

    return facepaint(...args);
};
