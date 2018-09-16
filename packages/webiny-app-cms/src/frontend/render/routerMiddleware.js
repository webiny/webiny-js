// @flow
import type { Node } from "react";
import api from "./api";
import { createRenderer } from "./pageRenderer";

declare type CmsMiddlewareConfig = {
    widget?: Array<(params: Object, next: Function, finish: Function) => void>,
    handle?: (params: Object) => boolean,
    page?: (content: Node) => Node
};

export default (config: CmsMiddlewareConfig = {}) => {
    // Define handle function to check if this middleware needs to process the matched route
    const handle = config.handle || (({ route }) => route.path === "*");

    // Create page renderer
    const renderPage = createRenderer(config);

    // CMS middleware
    return async (params: Object, next: Function, finish: Function) => {
        const { match } = params;

        if (handle(params)) {
            return api
                .loadPage(match.url)
                .then(async data => {
                    params.output = await renderPage(data);
                    finish(params);
                })
                .catch(() => {
                    next();
                });
        }

        if (match.params.revision) {
            return api.loadPageRevision(match.params.revision).then(async data => {
                params.output = await renderPage(data);
                finish(params);
            });
        }

        next();
    };
};
