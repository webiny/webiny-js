import { useEffect } from "react";
import type { Route, RouteParamsDefinition, RouteParamsInfer } from "~/features/router/Route.js";
import { useRouter } from "~/router.js";
import type { RequiredKeysOf } from "type-fest";

export type RedirectProps<TParams extends RouteParamsDefinition | undefined> = [
    TParams extends RouteParamsDefinition
        ? RequiredKeysOf<RouteParamsInfer<TParams>> extends never
            ? { route: Route<TParams>; params?: RouteParamsInfer<TParams> }
            : { route: Route<TParams>; params: RouteParamsInfer<TParams> }
        : { route: Route<TParams> }
][0];

export const RedirectComponent = <TParams extends RouteParamsDefinition | undefined>(
    props: RedirectProps<TParams>
) => {
    const router = useRouter();
    const { route, ...rest } = props as any;

    useEffect(() => {
        router.goToRoute(route, rest.params);
    }, []);

    return null;
};
