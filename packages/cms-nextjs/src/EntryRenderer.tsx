"use client";

import React, { useState, useEffect } from "react";
import { ComponentResolver, componentRegistry, contentSdk } from "@webiny/cms-sdk";
import type { ResolvedComponent, CmsModelDefinition } from "@webiny/cms-sdk";

interface EntryRendererProps {
    modelId: string;
    values: Record<string, unknown>;
    fieldId: string;
}

export const EntryRenderer = ({ modelId, values, fieldId }: EntryRendererProps) => {
    const [model, setModel] = useState<CmsModelDefinition | null>(null);

    useEffect(() => {
        console.log("[EntryRenderer] fetching model:", modelId);
        contentSdk.getModel(modelId).then(m => {
            console.log("[EntryRenderer] model loaded, componentMap:", m?.componentMap);
            setModel(m);
        });
    }, [modelId]);

    console.log("[EntryRenderer] fieldId:", fieldId, "value:", values[fieldId]);
    console.log("[EntryRenderer] registered components:", componentRegistry.getAll().map(c => c.manifest.name));

    if (!model) {
        return null;
    }

    const dzValue = values[fieldId];
    if (!dzValue) {
        console.log("[EntryRenderer] no DZ value for fieldId:", fieldId);
        return null;
    }

    const items = Array.isArray(dzValue) ? dzValue : [dzValue];
    console.log("[EntryRenderer] DZ items:", items.map(i => (i as any)?._templateId));

    const resolver = new ComponentResolver(componentRegistry);
    const resolved = resolver.resolve(items, model);
    console.log("[EntryRenderer] resolved:", resolved.length, resolved.map(r => r.componentName));

    return (
        <>
            {resolved.map((item, index) => (
                <ResolvedComponentRenderer key={`${item.templateId}-${index}`} resolved={item} />
            ))}
        </>
    );
};

interface ResolvedComponentRendererProps {
    resolved: ResolvedComponent;
}

const ResolvedComponentRenderer = ({ resolved }: ResolvedComponentRendererProps) => {
    const Component = resolved.component as React.ComponentType<Record<string, unknown>>;
    return <Component {...resolved.props} />;
};
