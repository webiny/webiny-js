import * as React from "react";
import { PbPageData } from "@webiny/app-page-builder/types";
import FooterMenu from "./FooterMenu";
import MainFooter from "./MainFooter";

export type FooterProps = {
    settings: Record<string, any>;
    page: PbPageData;
};

const Footer = (props: FooterProps) => {
    return (
        <div className={"webiny-pb-section-footer"} data-testid={"pb-footer"}>
            <FooterMenu />
            <MainFooter {...props} />
        </div>
    );
};

export default Footer;
