import React from "react";
import { app, resolveMiddleware, renderMiddleware, Router } from "webiny-app";
import { hot } from "react-hot-loader";
import { app as cmsApp, routerMiddleware as cmsMiddleware } from "webiny-app-cms";

if (!app.initialized) {
    app.configure(() => {
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
    });

    app.use(cmsApp());

    app.router.configure({
        middleware: [cmsMiddleware(), resolveMiddleware(), renderMiddleware()]
    });

    app.router.addRoute({
        name: "NotMatched",
        path: "*",
        render() {
            return app.modules.load(["ListData"]).then(({ ListData }) => {
                return (
                    <div>
                        <h1>{`404 Not Found`}</h1>
                        <ListData entity={"CmsPage"} fields={"id title slug"}>
                            {({ list }) => (
                                <ul>
                                    {list.map(l => (
                                        <li key={l.id}>
                                            <a href={l.slug}>{l.title}</a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </ListData>
                        <a href={"/"}>{`Get me out of here`}</a>
                    </div>
                );
            });
        }
    });
}

const App = () => {
    return <Router router={app.router} />;
};

export default hot(module)(App);
