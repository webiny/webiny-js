import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import type { Route, RouteParamsDefinition, RouteParamsInfer } from "~/features/router/Route.js";
import { SimpleLink } from "./SimpleLink.js";
import { useRouter } from "~/router.js";

type BaseAnchorAttributes = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

// The props are generic over the Route's schema.
export type RouteLinkProps<TParams extends RouteParamsDefinition | undefined> = [
    TParams extends RouteParamsDefinition
        ? {
              route: Route<TParams>;
              params: RouteParamsInfer<TParams>;
          }
        : { route: Route<TParams> }
][0] &
    BaseAnchorAttributes;

export const RouteLink = makeDecoratable(
    "RouteLink",
    <TParams extends RouteParamsDefinition | undefined>(props: RouteLinkProps<TParams>) => {
        const router = useRouter();

        const { children, route, ...rest } = props as any;

        const href = rest.params ? router.getLink(route!, rest.params) : router.getLink(route!);

        return (
            <SimpleLink to={href} {...rest}>
                {children}
            </SimpleLink>
        );
    }
);

export const RouteLinkComponent = RouteLink;
