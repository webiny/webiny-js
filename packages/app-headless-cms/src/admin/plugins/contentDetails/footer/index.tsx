import * as React from "react";
import { CmsContentDetailsPlugin } from "@webiny/app-headless-cms/types";
import Footer from "./Footer";
import SubmitButton from "./SubmitButton/SubmitButton";

const plugins: CmsContentDetailsPlugin[] = [
    {
        name: "cms-content-details-footer",
        type: "cms-content-details-revision-content-preview",
        render(props) {
            return <Footer {...props} />;
        }
    },
    {
        name: "cms-content-details-footer-right-submit",
        type: "cms-content-details-footer-right",
        render(props) {
            return <SubmitButton {...props} />;
        }
    }
];

export default plugins;
