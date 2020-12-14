import React from "react";
import { Addons } from "@webiny/app/components";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Static = ({ children }) => {
    return (
        <React.Fragment>
            <Addons />
            <Header />
            {children}
            <Footer />
        </React.Fragment>
    );
};

export default Static;
