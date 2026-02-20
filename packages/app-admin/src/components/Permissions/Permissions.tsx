import React, { useMemo } from "react";
import { Accordion } from "@webiny/admin-ui";
import type { BindComponentRenderProp } from "@webiny/form";
import { useAdminConfig } from "~/config/AdminConfig.js";
import type { PermissionRendererConfig } from "~/permissions/types.js";
import { PermissionValueProvider } from "~/permissions/PermissionValueContext.js";
import { PermissionRenderer } from "~/permissions/PermissionRenderer.js";

const byTitle = (a: PermissionRendererConfig, b: PermissionRendererConfig) => {
    return a.title.localeCompare(b.title);
};

interface PermissionsProps extends BindComponentRenderProp {
    id: string;
}

export const Permissions = ({ id, value, onChange }: PermissionsProps) => {
    const { permissionRenderers } = useAdminConfig();

    const renderers = useMemo<PermissionRendererConfig[]>(() => {
        const systemRenderers: PermissionRendererConfig[] = [];
        const appRenderers: PermissionRendererConfig[] = [];

        for (const renderer of permissionRenderers) {
            if (renderer.system) {
                systemRenderers.push(renderer);
            } else {
                appRenderers.push(renderer);
            }
        }

        return [...systemRenderers.sort(byTitle), ...appRenderers.sort(byTitle)];
    }, [permissionRenderers]);

    return (
        <Accordion>
            <PermissionValueProvider value={value} onChange={onChange}>
                {renderers.map(renderer => {
                    return (
                        <Accordion.Item
                            key={renderer.name + "." + id}
                            title={renderer.title}
                            description={renderer.description}
                            icon={
                                renderer.icon ? (
                                    <Accordion.Item.Icon
                                        icon={renderer.icon}
                                        label={renderer.title}
                                    />
                                ) : undefined
                            }
                            data-testid={`permission.${renderer.name}`}
                        >
                            {renderer.schema ? (
                                <PermissionRenderer schema={renderer.schema} />
                            ) : (
                                renderer.element
                            )}
                        </Accordion.Item>
                    );
                })}
            </PermissionValueProvider>
        </Accordion>
    );
};
