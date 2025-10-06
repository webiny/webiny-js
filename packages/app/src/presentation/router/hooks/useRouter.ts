import { type ReactRoute, RouteElementRegistry } from "~/presentation/router/index.js";
import { RouterFeature } from "~/features/router/index.js";
import { useFeature } from "~/shared/di/useFeature.js";
import { useContainer } from "~/shared/di/DiContainerProvider.js";

export const useRouter = () => {
    const { presenter } = useFeature(RouterFeature);
    const container = useContainer();
    const registry = container.resolve(RouteElementRegistry);

    return {
        goToRoute: presenter.goToRoute.bind(presenter),
        getLink: presenter.getLink.bind(presenter),
        onRouteExit: presenter.onRouteExit.bind(presenter),
        setRoutes: (routes: ReactRoute[]) => {
            const cleanRoutes = [];

            for (const route of routes) {
                cleanRoutes.push(route.route);
                registry.register(route.route.name, route.element);
            }

            presenter.bootstrap(cleanRoutes);
        }
    };
};
