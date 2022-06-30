/**
 * Package @commodo/fields has no types.
 */
// @ts-ignore
import { withFields, string, fields, onSet } from "@commodo/fields";
/**
 * Package commodo-fields-object has no types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import trimEnd from "lodash/trimEnd";

// We don't want trailing slashes in Page Builder app's important URLs (website URL, website preview URL, app URL).
const trimTrailingSlashes = (value: string): string => trimEnd(value, "/");

// `pid` (page ID) is an ID consisting only of the unique page ID, without the version suffix (e.g. #0002).
const extractPid = (value: string): string | null => {
    if (typeof value !== "string") {
        return null;
    }

    const [pid] = value.split("#");
    return pid || null;
};

export default withFields({
    name: string({ validation: "required,maxLength:500" }),
    websiteUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
    websitePreviewUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
    favicon: object({}),
    logo: object({}),
    social: fields({
        value: {},
        instanceOf: withFields({
            facebook: string({ validation: "url,maxLength:500" }),
            twitter: string({ validation: "url,maxLength:500" }),
            instagram: string({ validation: "url,maxLength:500" }),
            image: object({})
        })()
    }),
    pages: fields({
        value: {},
        instanceOf: withFields({
            home: onSet(extractPid)(string()),
            notFound: onSet(extractPid)(string())
        })()
    }),
    // TODO: implement this via a plugin when https://github.com/webiny/webiny-js/issues/2168 is resolved.
    theme: string()
})();
