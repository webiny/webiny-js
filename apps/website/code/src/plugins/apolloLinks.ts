import { OmitTypenameLinkPlugin } from "@webiny/app/plugins/OmitTypenameLinkPlugin";
import { LocaleHeaderLinkPlugin } from "@webiny/app/plugins/LocaleHeaderLinkPlugin";
import { TenantHeaderLinkPlugin } from "@webiny/app/plugins/TenantHeaderLinkPlugin";

export default () => [
    /**
     * This link removes `__typename` from the variables being sent to the API.
     */
    new OmitTypenameLinkPlugin(),
    /**
     * Append `x-tenant` header from URL query (necessary for prerendering service).
     */
    new TenantHeaderLinkPlugin(),
    /**
     * Append `x-i18n-locale` header from URL query (necessary for prerendering service).
     */
    new LocaleHeaderLinkPlugin()
];
