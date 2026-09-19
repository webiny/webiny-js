import React, { useMemo } from "react";
import { Alert } from "@webiny/admin-ui";
import { AdminConfig } from "~/config/AdminConfig.js";
import type { IFieldVM } from "~/features/formModel/abstractions.js";
import { useGeneratedRenderer } from "./useGeneratedRenderer.js";

export interface GeneratedFieldRendererProps {
    /** The renderer name a field asks for, e.g. `menuBuilder`. */
    name: string;
    /** TSX as stored. Transpiled here, in the browser. */
    source: string;
}

/**
 * Registers one generated renderer under the name fields ask for.
 *
 * Registration waits for the bundle. A renderer registered before its component exists would render
 * nothing for the first frame and, worse, would claim the name, so a field asking for it gets a blank
 * where the built-in fallback would have done. Nothing is registered until there is something to
 * register.
 *
 * A renderer that fails to compile registers a component that says so, in place of the field. The
 * alternative is silence, and silence on generated code means an editor sees an empty form and has
 * no idea why. The message is the bundler's, which is usually specific enough to act on.
 */
export const GeneratedFieldRenderer = ({ name, source }: GeneratedFieldRendererProps) => {
    const { component, error } = useGeneratedRenderer(source);

    const errorComponent = useMemo(() => {
        if (!error) {
            return null;
        }

        const FailedRenderer = ({ field }: { field: IFieldVM }) => (
            <Alert variant={"strong"}>
                {`Field renderer "${name}" (field "${field.name}") could not be loaded: ${error}`}
            </Alert>
        );

        return FailedRenderer;
    }, [error, name]);

    const resolved = component ?? errorComponent;

    if (!resolved) {
        return null;
    }

    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer name={name} component={resolved} />
        </AdminConfig>
    );
};
