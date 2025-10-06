import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { RouterGateway } from "~/features/router/abstractions.js";
import { useContainer } from "~/shared/di/DiContainerProvider.js";

type BaseAnchorAttributes = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export type SimpleLinkProps = BaseAnchorAttributes & {
    to: string;
};

export const SimpleLink = makeDecoratable(
    "SimpleLink",
    ({ children, to, ...rest }: SimpleLinkProps) => {
        const container = useContainer();

        const routerGateway = container.resolve(RouterGateway);

        const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
            // Respect cmd+click / ctrl+click / middle click → open in new tab
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.altKey ||
                event.ctrlKey ||
                event.shiftKey
            ) {
                return;
            }

            event.preventDefault();
            routerGateway.pushState(to);
        };

        return (
            <a href={to} rel="noreferrer noopener" {...rest} onClick={handleClick}>
                {children}
            </a>
        );
    }
);
