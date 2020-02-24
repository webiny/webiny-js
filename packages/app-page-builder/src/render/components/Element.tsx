import React, { useMemo } from "react";

import { getPlugins } from "@webiny/plugins";
import { PbElement, PbRenderElementPlugin, PbThemePlugin } from "@webiny/app-page-builder/types";

export type ElementProps = {
    element: PbElement;
};

// Using a class element for a change because `componentDidCatch` only works with class elements ;/
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            error: null,
            errorInfo: null
        }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        })
    }

    render() {
        if(this.state.error) {
            return (
                <div>
                    <h3>An unexpected error has occurred</h3>
                    <details>
                        <div>{this.state.error.toString()}</div>
                        <div>{this.state.errorInfo.componentStack}</div>
                    </details>
                </div>
            )
        }

        return this.props.children
    }
}

const Element = (props: ElementProps) => {
    const { element } = props;

    const theme = useMemo(
        () => Object.assign({}, ...getPlugins("pb-theme").map((pl: PbThemePlugin) => pl.theme)),
        []
    );

    if (!element) {
        return null;
    }

    const plugin = getPlugins<PbRenderElementPlugin>("pb-render-page-element").find(
        pl => pl.elementType === element.type
    ) as PbRenderElementPlugin;

    if (!plugin) {
        return null;
    }

    return <ErrorBoundary>{plugin.render({ theme, element })}</ErrorBoundary>;
};

export default Element;
