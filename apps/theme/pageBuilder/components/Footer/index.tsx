import * as React from "react";
import { PbPageData } from "@webiny/app-page-builder/types";
import FooterMenu from "./FooterMenu";
import MainFooter from "./MainFooter";
import Menu from "../Menu";

export type FooterProps = {
    settings: Record<string, any>;
    page: PbPageData;
};

const Footer = (props: FooterProps) => {
    return (
        <div className={"webiny-pb-section-footer"} data-testid={"pb-footer"}>
            <Menu slug={"/footer"} component={FooterMenu} />
            <MainFooter {...props} />
        </div>
    );
};

export default Footer;
