import React from "react";
import { Admin } from "@webiny/app-serverless-cms";
import { Extensions } from "./Extensions";

import "./App.scss";

export const App = () => {
    return (
        <Admin>
            <Extensions />
        </Admin>
    );
};
