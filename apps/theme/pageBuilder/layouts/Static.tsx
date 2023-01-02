import React from "react";
import { Header } from "./Static/Header";
import { Footer } from "./Static/Footer";
import styled from "@emotion/styled";
import { Global, css } from "@emotion/core";

const globalStyles = css`
    html {
        scroll-behavior: smooth;
    }

    @media screen and (prefers-reduced-motion: reduce) {
        html {
            scroll-behavior: smooth;
        }
    }
`;

const Layout = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;

    footer {
        margin-top: auto;
    }
`;

const Static: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <Layout>
            <Global styles={globalStyles} />
            <Header />
            <main>{children}</main>
            <Footer />
        </Layout>
    );
};

export default Static;
