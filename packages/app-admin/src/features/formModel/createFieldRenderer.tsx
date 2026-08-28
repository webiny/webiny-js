import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { makeDecoratable } from "@webiny/react-composition";
import type { IFieldVM, IObjectFieldVM, FieldRendererSettings } from "./abstractions.js";

/**
 * Decoratable wrapper rendered around every leaf field's content. Features can decorate it to
 * inject per-field UI (e.g. a comment marker) keyed on `field.qualifiedName`, without forking
 * the form. By default it renders the field content unchanged.
 */
export const FormFieldWrapper = makeDecoratable(
    "FormFieldWrapper",
    ({ children }: { field: IFieldVM; children?: React.ReactNode }) => {
        return <>{children}</>;
    }
);

type RendererField<TName extends string> = IFieldVM & {
    rendererSettings: FieldRendererSettings<TName>;
};

type ObjectRendererField<TName extends string> = IObjectFieldVM & {
    rendererSettings: FieldRendererSettings<TName>;
};

type FieldRendererFn<TName extends string> = (props: {
    field: RendererField<TName>;
}) => React.ReactNode;

// How long the field stays visually highlighted after focus lands, so the user's eye is drawn
// to where "jump to field" (a comment locator, a form error) scrolled to.
const FOCUS_HIGHLIGHT_MS = 1800;

const ScrollOnFocus = observer(
    ({ field, children }: { field: IFieldVM; children: React.ReactNode }) => {
        const ref = useRef<HTMLDivElement>(null);
        const [highlighted, setHighlighted] = useState(false);
        const highlightTimer = useRef<number | null>(null);

        useEffect(() => {
            if (field.focusRequested && ref.current) {
                setTimeout(() => {
                    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 150);
                // Flash a highlight ring so it's obvious where focus landed. The timer is kept in a
                // ref (not tied to the effect cleanup) so clearing the focus request below — which
                // re-runs this effect — doesn't cut the highlight short.
                setHighlighted(true);
                if (highlightTimer.current) {
                    window.clearTimeout(highlightTimer.current);
                }
                highlightTimer.current = window.setTimeout(
                    () => setHighlighted(false),
                    FOCUS_HIGHLIGHT_MS
                );
            }
            field.clearFocusRequest();
        }, [field.focusRequested]);

        useEffect(() => {
            return () => {
                if (highlightTimer.current) {
                    window.clearTimeout(highlightTimer.current);
                }
            };
        }, []);

        return (
            <div
                ref={ref}
                data-field-path={field.qualifiedName}
                style={{
                    // Padding gives the highlight ring/tint breathing room from the field content;
                    // the matching negative margin keeps the field's layout position unchanged.
                    padding: 6,
                    margin: -6,
                    borderRadius: 8,
                    transition: "box-shadow .35s ease, background-color .35s ease",
                    boxShadow: highlighted ? "0 0 0 2px var(--color-primary)" : undefined,
                    backgroundColor: highlighted ? "var(--color-primary-100)" : undefined
                }}
            >
                <FormFieldWrapper field={field}>{children}</FormFieldWrapper>
            </div>
        );
    }
);

export function createFieldRenderer<TName extends string = string>(
    render: FieldRendererFn<TName>
): React.ComponentType<{ field: IFieldVM }> {
    const Inner = observer(render as FieldRendererFn<string>) as unknown as React.ComponentType<{
        field: IFieldVM;
    }>;

    const Wrapper = observer(({ field }: { field: IFieldVM }) => (
        <ScrollOnFocus field={field}>
            <Inner field={field} />
        </ScrollOnFocus>
    ));

    return Wrapper as unknown as React.ComponentType<{ field: IFieldVM }>;
}

export function createObjectFieldRenderer<TName extends string = string>(
    render: (props: { field: ObjectRendererField<TName> }) => React.ReactNode
): React.ComponentType<{ field: IFieldVM }> {
    const Wrapped = (props: { field: IFieldVM }) => {
        if (props.field.type !== "object") {
            return null;
        }
        return (render as (p: { field: IFieldVM }) => React.ReactNode)(props);
    };
    return observer(Wrapped) as unknown as React.ComponentType<{ field: IFieldVM }>;
}
