import React from "react";
import { app, resolveMiddleware, renderMiddleware, Router } from "webiny-app";
import { hot } from "react-hot-loader";
import { app as cmsApp, routerMiddleware as cmsMiddleware } from "webiny-app-cms";

if (!app.initialized) {
    app.configure(() => {
        if (process.env.NODE_ENV === "development") {
            app.graphql.setConfig({
                uri: "http://localhost:9000/graphql",
                defaultOptions: {
                    watchQuery: {
                        fetchPolicy: "network-only",
                        errorPolicy: "all"
                    },
                    query: {
                        fetchPolicy: "network-only",
                        errorPolicy: "all"
                    }
                }
            });
        }
    });

    app.use(cmsApp());

    app.router.configure({
        middleware: [cmsMiddleware(), resolveMiddleware(), renderMiddleware()]
    });

    app.router.addRoute({
        name: "NotMatched",
        path: "*",
        render() {
            return (
                <div>
                    <h1>{`404 Not Found`}</h1>
                    <a href={"/"}>{`Get me out of here`}</a>
                </div>
            );
        }
    });
}

const App = () => {
    return <Router router={app.router} />;
};

export default hot(module)(App);

/*{
    widget: [
        (params, next) => {
            if (params.widget.type === "image") {
                params.output = (
                    <div style={{ border: "1px solid black", padding: 10 }}>
                        Widget wrapper<br />
                        <br />
                        {params.defaultWidgetRender(params)}
                    </div>
                );
            }

            next();
        }
    ]
}*/
