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
        <>
            <Header {...rest} />
            <article>
                <ps-tag data-key={"pb-page"} data-value={rest.page.id} />
                {children}
            </article>
            <Footer {...rest} />
        </>
    );
};

export default Static;
