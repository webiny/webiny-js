import React, { useEffect, useState } from "react";
import { useFeature } from "@webiny/app";
import { GeneratedFieldRenderer } from "@webiny/app-admin";
import { AdminComponentsFeature } from "~/admin/features/adminComponents/feature.js";
import { useRegisterCmsFieldRenderers } from "~/admin/features/adminComponents/useRegisterCmsFieldRenderers.js";
import type { AdminComponent } from "~/admin/features/adminComponents/abstractions.js";

/**
 * Loads every stored field renderer and registers it in both places it has to be.
 *
 * A generated renderer needs two registrations to be usable, and they are separate registries:
 * `AdminConfig.Form.FieldRenderer` resolves a name to a component when a form renders, and
 * `CmsFieldRenderer` is the catalogue the field editor's Appearance tab offers. One without the
 * other gives you either a renderer nothing can select, or an option that draws nothing.
 *
 * Mounted once, near the root, because a field renderer has to exist before any form asks for it.
 * Fetched once per admin load rather than watched: a renderer the assistant writes mid-session
 * appears on the next load, which matches how every other extension in the admin behaves.
 *
 * A failed fetch registers nothing and says nothing. The admin has to render without this, and a
 * project that never generated a renderer gets an empty list on every page, which is not an error to
 * report. The failure that DOES need reporting is a renderer that will not compile, and that one is
 * shown where the field is, by `GeneratedFieldRenderer`.
 */
export const GeneratedFieldRenderers = () => {
    const { gateway } = useFeature(AdminComponentsFeature);
    const [components, setComponents] = useState<AdminComponent[]>([]);

    useEffect(() => {
        let cancelled = false;

        gateway
            .execute("fieldRenderer")
            .then(result => {
                if (!cancelled) {
                    setComponents(result);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setComponents([]);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [gateway]);

    /* Makes each one selectable in the field editor; the JSX below makes it render. */
    useRegisterCmsFieldRenderers(components);

    return (
        <>
            {components.map(component => (
                <GeneratedFieldRenderer
                    key={component.id}
                    name={component.name}
                    source={component.source}
                />
            ))}
        </>
    );
};
