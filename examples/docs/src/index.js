import React from "react";
import ReactDOM from "react-dom";
import { createBrowserHistory } from "history";
import { app, renderMiddleware, Router } from "webiny-client";

// Configure app router
app.router.configure({
    history: createBrowserHistory({ basename: "/" }),
    middleware: [renderMiddleware()]
});

app.router.addRoute({
    name: "All",
    exact: true,
    path: "/",
    render() {
        return (
            <div>
                <h2>Hi, this is a dummy view!</h2>
                <a href="/second-page">Second page</a>
            </div>
        );
    }
});

app.router.addRoute({
    name: "All",
    path: "/second-page",
    render() {
        return (
            <div>
                <h2>Second page!</h2>
                <a href="/">Go back</a>
            </div>
        );
    }
});

app.setup().then(() => {
    ReactDOM.render(<Router router={app.router} />, document.getElementById("root"));
});
