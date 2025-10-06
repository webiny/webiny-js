import { useEffect, useState } from "react";
import { autorun } from "mobx";
import type { Route, RouteParamsDefinition, RouteParamsInfer } from "~/features/router/Route.js";
import { MatchedRoute } from "~/features/router/abstractions.js";
import { RouterFeature } from "~/features/router/index.js";
import { useFeature } from "~/shared/di/useFeature.js";

export function useRoute<TParams extends RouteParamsDefinition | undefined = undefined>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    route?: Route<TParams>
) {
    const { presenter } = useFeature(RouterFeature);
    const [currentRoute, setCurrentRoute] = useState<MatchedRoute | undefined>(
        presenter.vm.currentRoute
    );

    useEffect(() => {
        autorun(() => {
            const route = presenter.vm.currentRoute;

            if (!route) {
                return;
            }

            setCurrentRoute(route);
        });
    }, []);

    // TODO: add validation (the requested route must match  the current route)

    return {
        route: currentRoute as MatchedRoute<
            TParams extends RouteParamsDefinition ? RouteParamsInfer<TParams> : undefined
        >,
        setRouteParams: presenter.setRouteParams.bind(presenter)
    };
}
