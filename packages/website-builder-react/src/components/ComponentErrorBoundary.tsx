"use client";
import React from "react";

interface ComponentErrorBoundaryProps {
    /** The component this wraps, for the message — a name is the only thing that makes it actionable. */
    componentName: string;
    children: React.ReactNode;
}

interface ComponentErrorBoundaryState {
    failed: boolean;
}

/**
 * Keeps one throwing component from costing the whole page.
 *
 * Without it, a component that throws takes down everything around it: on a server-rendered page that
 * is an HTTP 500, so a visitor gets an error page instead of a site. Measured on a migration, one
 * component reading a list that arrived as a string killed five of eleven pages outright — every other
 * section on them was correct and rendered nothing.
 *
 * A page missing one section is a degraded page and legible as such. A page returning 500 is not a
 * page. That difference is the whole reason this exists, and it is worth having whatever bug is
 * upstream: the next faulty component is not going to announce itself either.
 *
 * Renders nothing in place of the failure rather than a visible error: this runs on a live site, and a
 * visitor is not the audience for a stack trace. The reason goes to the console, where the operator
 * looking at a missing section will find it.
 */
export class ComponentErrorBoundary extends React.Component<
    ComponentErrorBoundaryProps,
    ComponentErrorBoundaryState
> {
    constructor(props: ComponentErrorBoundaryProps) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError(): ComponentErrorBoundaryState {
        return { failed: true };
    }

    override componentDidCatch(error: Error) {
        // Named, because "a section is missing" is not something anyone can act on by itself.
        console.error(
            `[WebsiteBuilder] Component "${this.props.componentName}" failed to render and was skipped:`,
            error
        );
    }

    override render() {
        if (this.state.failed) {
            return null;
        }
        return this.props.children;
    }
}
