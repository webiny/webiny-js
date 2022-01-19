import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PbPageData } from "@webiny/app-page-builder/types";

type StaticProps = {
    children: React.ReactNode;
    settings: Record<string, any>;
    page: PbPageData;
};

const Static = ({ children, ...rest }: StaticProps) => {
    return (
        <React.Fragment>
            <Header {...rest} />
            {children}
            <Footer {...rest} />
        </React.Fragment>
    );
};

export default Static;
