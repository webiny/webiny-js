import createSite, { SiteAppOptions } from "@webiny/app-template-site";
import "./App.scss";

export default (params: SiteAppOptions = {}) => {
    return createSite(params);
};
