# webiny-app

A thin framework for developing `React` apps which plays nicely with our API layer and takes code-splitting to another level
by wrapping it and providing more control over your lazy loaded modules.

## How it works
When designing the framework we were greatly inspired by `express` and how it makes use of middleware functions.
So we tried the same approach for building client apps and so far we are very happy with the results.

As soon as you do the first import from `webiny-app` a singleton `app` instance is created and it serves as an empty skeleton.
The most simple app looks like this:

```
import React from "react";
import ReactDOM from "react-dom";
import { app, renderMiddleware, Router } from "webiny-app";

// Configure app router
app.router.configure({
    middleware: [
        renderMiddleware() // Yes, our router is plugginable, more about this later
    ]
});

// Add a homepage route
app.router.addRoute({
    name: "Homepage",
    exact: true, // must match exactly
    path: "/",
    render() {
        return (
            <div>
                <h2>Hi, this is a homepage!</h2>
                <a href="/second-page">Second page</a>
            </div>
        );
    }
});


// Add a second route
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
```

## Core concepts
The `app` instance doesn't do much but it contains several components that run the whole app:

- router
- module loader
- service manager

