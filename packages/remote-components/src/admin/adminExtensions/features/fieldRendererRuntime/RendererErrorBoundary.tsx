import React from "react";
import { Text } from "@webiny/admin-ui";

interface RendererErrorBoundaryProps {
    label: string;
    children: React.ReactNode;
}

interface RendererErrorBoundaryState {
    error: Error | null;
}

/**
 * Keeps a generated renderer that throws from taking the rest of the form down with it.
 *
 * `createFieldRenderer` already wraps its content in `FormFieldWrapper`, whose boundary catches render
 * errors first. This one covers a `Renderer` written without it, and anything thrown around it.
 */
export class RendererErrorBoundary extends React.Component<
    RendererErrorBoundaryProps,
    RendererErrorBoundaryState
> {
    override state: RendererErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): RendererErrorBoundaryState {
        return { error };
    }

    override render() {
        if (this.state.error) {
            return (
                <Text as="div" size="sm" className="text-destructive-primary">
                    {`"${this.props.label}" could not render: ${this.state.error.message}`}
                </Text>
            );
        }
        return this.props.children;
    }
}
