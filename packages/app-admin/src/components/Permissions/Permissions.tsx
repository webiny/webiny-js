import React, { useMemo } from "react";
import type { AdminAppPermissionRendererPlugin } from "~/types.js";
import { Accordion } from "@webiny/ui/Accordion/index.js";
import { plugins } from "@webiny/plugins";
import type { BindComponentRenderProp } from "@webiny/form";
import type { PermissionRendererPlugin } from "~/plugins/PermissionRendererPlugin.js";
import { useAdminConfig } from "~/config/AdminConfig.js";
import type { PermissionRendererConfig } from "~/permissions/types.js";

interface PermissionsProps extends BindComponentRenderProp {
    id: string;
    plugins?: PermissionRendererPlugin[];
}

interface PermissionPlugins {
    systemPlugins: (AdminAppPermissionRendererPlugin | PermissionRendererPlugin)[];
    permissionPlugins: (AdminAppPermissionRendererPlugin | PermissionRendererPlugin)[];
}

type RenderItem =
    | { type: "plugin"; plugin: AdminAppPermissionRendererPlugin | PermissionRendererPlugin }
    | { type: "config"; renderer: PermissionRendererConfig };

export const Permissions = ({ id, value, onChange, ...props }: PermissionsProps) => {
    const { permissionRenderers } = useAdminConfig();

    const { systemPlugins, permissionPlugins } = useMemo<PermissionPlugins>(() => {
        if (props.plugins) {
            return { permissionPlugins: props.plugins, systemPlugins: [] };
        }

        return plugins
            .byType<AdminAppPermissionRendererPlugin>("admin-app-permissions-renderer")
            .reduce(
                (acc, plugin) => {
                    if (plugin.system === true) {
                        acc.systemPlugins.push(plugin);
                    } else {
                        acc.permissionPlugins.push(plugin);
                    }
                    return acc;
                },
                { systemPlugins: [], permissionPlugins: [] } as PermissionPlugins
            );
    }, []);

    const items = useMemo<RenderItem[]>(() => {
        const systemRenderers: PermissionRendererConfig[] = [];
        const appRenderers: PermissionRendererConfig[] = [];

        for (const renderer of permissionRenderers) {
            if (renderer.system) {
                systemRenderers.push(renderer);
            } else {
                appRenderers.push(renderer);
            }
        }

        return [
            ...systemPlugins.map(plugin => ({ type: "plugin" as const, plugin })),
            ...systemRenderers.map(renderer => ({ type: "config" as const, renderer })),
            ...permissionPlugins.map(plugin => ({ type: "plugin" as const, plugin })),
            ...appRenderers.map(renderer => ({ type: "config" as const, renderer }))
        ];
    }, [permissionRenderers, systemPlugins, permissionPlugins]);

    return (
        <Accordion elevation={0}>
            {items.map(item => {
                if (item.type === "plugin") {
                    return (
                        <React.Fragment key={item.plugin.name + "." + id}>
                            {item.plugin.render({ value, onChange })}
                        </React.Fragment>
                    );
                }
                return (
                    <React.Fragment key={item.renderer.name + "." + id}>
                        {React.cloneElement(item.renderer.element, { value, onChange })}
                    </React.Fragment>
                );
            })}
        </Accordion>
    );
};
