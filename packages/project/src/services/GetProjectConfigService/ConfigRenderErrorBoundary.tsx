import React from "react";

export interface ConfigRenderErrorBoundaryProps {
    children: React.ReactNode;
    onError: (error: Error) => void;
}

interface ConfigRenderErrorBoundaryState {
    hasError: boolean;
}

/*
 * React does not let a `root.render()` call throw back at whoever made it. An extension component
 * that throws would otherwise take the whole CLI down as an uncaught exception, which is what the
 * old child process papered over with a `process.on("uncaughtException")` handler. Catching it here
 * turns it back into a rejected promise that `renderConfig` can report against the config file.
 *
 * Rendering `null` once it has caught is the part that matters: keep rendering the children and they
 * throw again, React retries, and after enough attempts it gives up and rethrows past the boundary.
 */
export class ConfigRenderErrorBoundary extends React.Component<
    ConfigRenderErrorBoundaryProps,
    ConfigRenderErrorBoundaryState
> {
    override state: ConfigRenderErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ConfigRenderErrorBoundaryState {
        return { hasError: true };
    }

    override componentDidCatch(error: Error) {
        this.props.onError(error);
    }

    override render() {
        if (this.state.hasError) {
            return null;
        }

        return this.props.children;
    }
}
