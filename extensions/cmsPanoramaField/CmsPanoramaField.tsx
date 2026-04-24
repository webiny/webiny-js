import React from "react";
import { CmsModelLayoutFieldType, CmsModelLayoutFieldRenderer } from "webiny/admin/cms";
import { ReactComponent as PanoramaIcon } from "webiny/admin/icons/360.svg";
import { PanoramaLayoutEditor, type PanoramaField } from "./PanoramaLayoutEditor.js";
import { PanoramaFieldRenderer } from "./PanoramaFieldRenderer.js";

// Include pannellum library like this, because neither NPM nor CDN packge has has hotspot dragging support
import "./libpannellum.js";
import "./pannellum.js";

export default () => {
    return (
        <>
            <CmsModelLayoutFieldType<PanoramaField>
                type="panorama"
                label="Panorama"
                description="Display a 360° panorama viewer with interactive hotspots."
                icon={<PanoramaIcon />}
                canEditSettings
                createField={() => ({
                    type: "panorama",
                    label: "Panorama",
                    imageFieldPath: ""
                })}
                render={({ field, onUpdate, onDelete }) => (
                    <PanoramaLayoutEditor field={field} onUpdate={onUpdate} onDelete={onDelete} />
                )}
            />
            <CmsModelLayoutFieldRenderer<PanoramaField>
                fieldType="panorama"
                render={({ field }) => <PanoramaFieldRenderer field={field} />}
            />
        </>
    );
};
