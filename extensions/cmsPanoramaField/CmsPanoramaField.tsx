import React, { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type { CmsLayoutFieldTypePlugin } from "webiny/admin/cms";
import type { CmsLayoutDescriptorRendererPlugin } from "webiny/admin/cms";
import { ReactComponent as PanoramaIcon } from "webiny/admin/icons/360.svg";
import { PanoramaLayoutEditor, type PanoramaDescriptor } from "./PanoramaLayoutEditor.js";
import { PanoramaFieldRenderer } from "./PanoramaFieldRenderer.js";

// Include pannellum library like this, because neither NPM nor CDN packge has has hotspot dragging support
import "./libpannellum.js";
import "./pannellum.js";

export default () => {
    useEffect(() => {
        const layoutFieldPlugin: CmsLayoutFieldTypePlugin = {
            type: "cms-editor-layout-field-type",
            name: "cms-editor-layout-field-type-panorama",
            field: {
                type: "panorama",
                label: "Panorama",
                description: "Display a 360° panorama viewer with interactive hotspots.",
                icon: <PanoramaIcon />,
                canEditSettings: true,
                createDescriptor() {
                    return {
                        type: "panorama",
                        label: "Panorama",
                        imageFieldPath: "",
                        hotspotsFieldPath: "",
                        startPositionFieldPath: "",
                        panLimitsFovFieldPath: ""
                    };
                },
                render({ descriptor, onUpdate, onDelete }) {
                    return (
                        <PanoramaLayoutEditor
                            descriptor={descriptor as PanoramaDescriptor}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    );
                }
            }
        };

        const rendererPlugin: CmsLayoutDescriptorRendererPlugin = {
            type: "cms-layout-descriptor-renderer",
            name: "cms-layout-descriptor-renderer-panorama",
            descriptorType: "panorama",
            render({ descriptor }) {
                return <PanoramaFieldRenderer descriptor={descriptor} />;
            }
        };

        plugins.register(layoutFieldPlugin, rendererPlugin);
    }, []);

    return null;
};
