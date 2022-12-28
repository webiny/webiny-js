import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PbPageData } from "@webiny/app-page-builder/types";

interface StaticProps {
    children: React.ReactNode;
    settings: Record<string, any>;
    page: PbPageData;
}

const Static: React.FC<StaticProps> = ({ children, ...rest }) => {
    return (
        <React.Fragment>
            <Header {...rest} />
            {children}
            <Footer {...rest} />
        </React.Fragment>
    );
};

export default Static;
