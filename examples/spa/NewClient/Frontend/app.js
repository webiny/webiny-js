import React from "react";
import { app, resolveMiddleware, renderMiddleware, Router } from "webiny-client";
import { createBrowserHistory } from "history";
import axios from "axios";
import { hot } from "react-hot-loader";

import { app as skeletonApp } from "webiny-skeleton-app";
import selectoApp from "./selectoApp";

if (!app.initialized) {
    app.use(skeletonApp());
    app.use(selectoApp());

    app.configure(() => {
        window.axios = axios;
        axios.defaults.baseURL = "http://localhost:9000/api";
        axios.defaults.headers["Authorization"] =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkZW50aXR5SWQiOiI1YWFkNTUwNmE1NGQ3NTcyZjE1N2MxZTEiLCJjbGFzc0lkIjoiU2VjdXJpdHkuVXNlciJ9LCJleHAiOjE1MjM5NTA2NDIsImlhdCI6MTUyMTM2MjI0Mn0.s323FvRfijZADEJ6J1eyeHAQ1ztG3B9vJjoik0_eGgo";

        return {
            i18n: false,
            api: "http://localhost:9000/api"
        };
    });

    app.router.configure({
        history: createBrowserHistory({ basename: "/" }),
        middleware: [resolveMiddleware(), renderMiddleware()]
    });
}

export default hot(module)(() => {
    return <Router router={app.router} />;
});
