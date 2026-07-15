"use client";

import React, { useMemo } from "react";
import { observer } from "mobx-react-lite";
import { ComponentResolver, ComponentRegistry } from "@webiny/cms-sdk";
import type { ResolvedComponent } from "@webiny/cms-sdk";
import { useComponents, useModel } from "./EntryRenderer.js";

interface DynamicZoneProps {
    value: unknown;
}

export const DynamicZoneField = observer(({ value }: DynamicZoneProps) => {
    const components = useComponents();
    const model = useModel();

    const registry = useMemo(() => {
        const reg = new ComponentRegistry();
        for (const component of components) {
            reg.register(component);
        }
        return reg;
    }, [components]);

    if (!model || !value) {
        return null;
    }

    const items = Array.isArray(value) ? value : [value];
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
