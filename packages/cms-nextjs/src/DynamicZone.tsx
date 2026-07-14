"use client";

import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ComponentResolver, ComponentRegistry, contentSdk } from "@webiny/cms-sdk";
import type { ResolvedComponent, CmsModelDefinition } from "@webiny/cms-sdk";
import { useEntryStore } from "./EntryStoreProvider.js";
import { useComponents } from "./EntryRenderer.js";

interface DynamicZoneProps {
    modelId: string;
    fieldId: string;
}

export const DynamicZone = observer(({ modelId, fieldId }: DynamicZoneProps) => {
    const store = useEntryStore();
    const values = store.getValues();
    const components = useComponents();
    const [model, setModel] = useState<CmsModelDefinition | null>(null);

    const registry = useMemo(() => {
        const reg = new ComponentRegistry();
        for (const component of components) {
            reg.register(component);
        }
        return reg;
    }, [components]);

    useEffect(() => {
        contentSdk.getModel(modelId).then(m => setModel(m));
    }, [modelId]);

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
