import React from "react";
import { Website } from "@webiny/app-website";
import "./App.scss";
import { Extensions } from "./Extensions";

export const App = () => {
    return (
        <Website>
            <Extensions />
        </Website>
    );
};
