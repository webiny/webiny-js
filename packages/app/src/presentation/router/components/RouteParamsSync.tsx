import { useEffect, useRef } from "react";
import { reaction } from "mobx";
import type { Route, RouteParamsDefinition } from "~/features/router/Route.js";
import { useRoute } from "~/presentation/router/hooks/useRoute.js";
import { useLocalStorage } from "~/presentation/localStorage/useLocalStorage.js";

export interface RouteParamFieldConfig<T> {
    param: string;
    read: () => T | undefined;
    write: (value: T | undefined) => void;
    storageKey?: string;
}

export interface RouteParamField {
    param: string;
    read: () => unknown;
    write: (value: unknown) => void;
    storageKey?: string;
}

export interface RouteParamFieldBuilder {
    create<T>(config: RouteParamFieldConfig<T>): RouteParamField;
}

const fieldBuilder: RouteParamFieldBuilder = {
    create<T>(config: RouteParamFieldConfig<T>): RouteParamField {
        return config as RouteParamField;
    }
};

interface RouteParamsSyncProps<TParams extends RouteParamsDefinition | undefined> {
    route: Route<TParams>;
    fields: (builder: RouteParamFieldBuilder) => RouteParamField[];
}

export function RouteParamsSync<TParams extends RouteParamsDefinition | undefined>({
    route: routeDefinition,
    fields: buildFields
}: RouteParamsSyncProps<TParams>) {
    const localStorage = useLocalStorage();
    const { route, setRouteParams, replaceRouteParams } = useRoute(routeDefinition);
    const syncingFromUrl = useRef(false);
    const fields = buildFields(fieldBuilder);

    // URL → State: apply route params to presenter state on browser navigation.
    useEffect(() => {
        syncingFromUrl.current = true;

        for (const field of fields) {
            const urlValue = (route.params as Record<string, unknown>)[field.param];
            field.write(urlValue);
        }

        queueMicrotask(() => {
            syncingFromUrl.current = false;
        });
    }, fields.map(f => (route.params as Record<string, unknown>)[f.param]));

    // State → URL: when MobX observable values change, update route params.
    useEffect(() => {
        return reaction(
            () => {
                const values: Record<string, unknown> = {};
                for (const field of fields) {
                    values[field.param] = field.read();
                }
                return values;
            },
            values => {
                for (const field of fields) {
                    if (field.storageKey) {
                        const val = values[field.param];
                        if (val !== undefined && val !== null && val !== "") {
                            localStorage.set(field.storageKey, val);
                        } else {
                            localStorage.remove(field.storageKey);
                        }
                    }
                }

                const update = syncingFromUrl.current ? replaceRouteParams : setRouteParams;

                update((params: Record<string, unknown>) => {
                    const next = { ...params };
                    for (const field of fields) {
                        next[field.param] = values[field.param];
                    }
                    return next;
                });
            },
            {
                equals: (a, b) => {
                    for (const field of fields) {
                        if (a[field.param] !== b[field.param]) {
                            return false;
                        }
                    }
                    return true;
                }
            }
        );
    }, []);

    return null;
}
