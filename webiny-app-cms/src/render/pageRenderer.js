import React from "react";
import invariant from "invariant";
import compose from "webiny-compose";
import { app } from "webiny-app";
import Page from "./Page";

/**
 * Default logic for single widget rendering.
 */
const defaultWidgetRender = ({ widget }) => {
    const cms = app.services.get("cms");

    const widgetDefinition = cms.getWidget(widget.type);
    invariant(widgetDefinition, `Missing widget definition for type "${widget.type}"`);

    return React.cloneElement(widgetDefinition.widget.render(widget), { widget });
};

/**
 * Default middleware for rendering of page widgets.
 * It will not render anything if there already is an output assigned by previous middleware.
 */
const defaultWidgetRenderMiddleware = (params: Object, next: Function) => {
    if (params.output) {
        return next();
    }
    params.output = defaultWidgetRender(params);
    next();
};

/**
 * Page renderer factory
 * @param config
 * @returns {Function}
 */
export const createRenderer = config => {
    const widgetRender = config.widget || [];
    const widgetRenderMiddleware = compose([...widgetRender, defaultWidgetRenderMiddleware]);

    return async data => {
        const content = [];
        for (let i = 0; i < data.content.length; i++) {
            const widgetParams = {
                page: data,
                widget: data.content[i],
                output: null,
                defaultWidgetRender
            };
            await widgetRenderMiddleware(widgetParams);
            const { output } = widgetParams;
            // $FlowIgnore
            content.push(React.cloneElement(output, { key: data.content[i].id }));
        }
        return <Page page={data}>{content}</Page>;
    };
};
