import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Decorator } from "@webiny/react-composition";
import { Compose, makeDecoratable } from "@webiny/react-composition";
import type { GenericComponent } from "@webiny/react-composition/types.js";
import type { Property } from "~/index.js";
import { Properties, toObject } from "~/index.js";
import { useDebugConfig } from "./useDebugConfig.js";
import { PropertyPriorityProvider } from "./PropertyPriority.js";

/**
 * Each `<Config>` call composes a new HOC around the previous one via `Compose`.
 * The last composed HOC is the outermost wrapper. By placing `{newChildren}`
 * (this HOC's addition) before `{children}` (all previously composed configs),
 * the final render order matches declaration order:
 *
 *   <Config>A</Config>  →  renders first  (outermost HOC, its newChildren rendered first)
 *   <Config>B</Config>  →  renders second
 *   <Config>C</Config>  →  renders third  (innermost, rendered last via children chain)
 *
 * This is important because Property components register in mount order,
 * so declaration order = mount order = predictable config resolution.
 */
const createHOC =
    (newChildren: React.ReactNode): Decorator<GenericComponent<{ children?: React.ReactNode }>> =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
    };

export interface WithConfigProps {
    children: React.ReactNode;
    onProperties?(properties: Property[]): void;
}

interface ConfigApplyProps {
    children?: React.ReactNode;
}

export interface ConfigProps {
    children: React.ReactNode;
    priority?: "primary" | "secondary";
}

export function createConfigurableComponent<TConfig>(name: string) {
    const ConfigApplyPrimary = makeDecoratable(
        `${name}ConfigApply<Primary>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    const ConfigApplySecondary = makeDecoratable(
        `${name}ConfigApply<Secondary>`,
        ({ children }: ConfigApplyProps) => {
            return <>{children}</>;
        }
    );

    const Config = ({ priority = "primary", children }: ConfigProps) => {
        if (priority === "primary") {
            return <Compose component={ConfigApplyPrimary} with={createHOC(children)} />;
        }
        return <Compose component={ConfigApplySecondary} with={createHOC(children)} />;
    };

    interface ViewContext {
        properties: Property[];
    }

    const defaultContext = { properties: [] };

    const ViewContext = React.createContext<ViewContext>(defaultContext);

    /**
     * Memoized config subtree — ConfigApply components don't depend on WithConfig
     * props, so they must not remount when the parent re-renders. Without this,
     * every parent re-render causes Property components inside HOCs to unmount
     * and remount, corrupting the config object.
     */
    const ConfigApplyTree = React.memo(function ConfigApplyTree() {
        return (
            <>
                <ConfigApplyPrimary />
                <PropertyPriorityProvider priority={1}>
                    <ConfigApplySecondary />
                </PropertyPriorityProvider>
            </>
        );
    });

    const WithConfig = ({ onProperties, children }: WithConfigProps) => {
        // `null` = config not yet collected; `[]` = collected but empty.
        // This distinction is critical: children must NOT render until the
        // PropertyStore debounce has flushed and delivered the initial config.
        // Rendering children with partial/empty config causes errors in
        // consumers like LexicalEditor that require a complete config on mount.
        const [properties, setProperties] = useState<Property[] | null>(null);
        const resolvedProperties = properties ?? [];
        useDebugConfig(name, resolvedProperties);
        const context = { properties: resolvedProperties };

        useEffect(() => {
            if (properties !== null && typeof onProperties === "function") {
                onProperties(properties);
            }
        }, [properties]);

        const stateUpdater = useCallback((properties: Property[]) => {
            setProperties(properties);
        }, []);

        return (
            <ViewContext.Provider value={context}>
                {/* ConfigApplyTree always renders so Property components inside
                    composed HOCs can mount and register with the PropertyStore.
                    It lives outside the children gate below. */}
                <Properties onChange={stateUpdater}>
                    <ConfigApplyTree />
                </Properties>
                {/* Gate: only render children once the PropertyStore has flushed
                    its first batch (properties !== null). This guarantees that
                    useConfig() returns a complete config object on first render. */}
                {properties !== null ? children : null}
            </ViewContext.Provider>
        );
    };

    function useConfig<TExtra extends object>(): TConfig & TExtra {
        const { properties } = useContext(ViewContext);
        return useMemo(() => toObject<TConfig & TExtra>(properties), [properties]);
    }

    return {
        WithConfig,
        Config,
        useConfig
    };
}
