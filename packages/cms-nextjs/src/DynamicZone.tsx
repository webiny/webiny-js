"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ComponentResolver, ComponentRegistry } from "@webiny/cms-sdk";
import type { ResolvedComponent } from "@webiny/cms-sdk";
import { useEntryStore } from "./EntryStoreProvider.js";
import { useComponents, useModel } from "./EntryRenderer.js";

interface DynamicZoneProps {
    fieldId: string;
}

export const DynamicZone = observer(({ fieldId }: DynamicZoneProps) => {
    const store = useEntryStore();
    const values = store.getValues();
    const components = useComponents();
    const model = useModel();

    const registry = useMemo(() => {
        const reg = new ComponentRegistry();
        for (const component of components) {
            reg.register(component);
        }
        return reg;
    }, [components]);

    if (!model || !values) {
        return null;
    }

    const dzValue = values[fieldId];
    if (!dzValue) {
        return null;
    }

    const items = Array.isArray(dzValue) ? dzValue : [dzValue];
    const resolver = new ComponentResolver(registry);
    const resolved = resolver.resolve(items, model);

    return (
        <>
            {resolved.map((item, index) => (
                <ResolvedComponentRenderer key={`${item.templateId}-${index}`} resolved={item} />
            ))}
        </>
    );
});

interface ResolvedComponentRendererProps {
    resolved: ResolvedComponent;
}

const ResolvedComponentRenderer = ({ resolved }: ResolvedComponentRendererProps) => {
    const Comp = resolved.component as React.ComponentType<Record<string, unknown>>;
    return <Comp {...resolved.props} />;
};
