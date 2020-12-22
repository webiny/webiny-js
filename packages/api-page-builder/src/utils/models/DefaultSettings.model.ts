import { withFields, string, fields, onSet } from "@commodo/fields";
import { object } from "commodo-fields-object";
import trimEnd from "lodash/trimEnd";

// We don't want trailing slashes in Page Builder app's important URLs (website URL, website preview URL, app URL).
const trimTrailingSlashes = value => trimEnd(value, "/");

export default withFields({
    name: string({ validation: "required,maxLength:500" }),
    websiteUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
    websitePreviewUrl: onSet(trimTrailingSlashes)(string({ validation: "url,maxLength:500" })),
    favicon: object({}),
    logo: object({}),
    prerendering: fields({
        instanceOf: withFields({
            app: fields({
                instanceOf: withFields({
                    url: onSet(trimTrailingSlashes)(string({ validation: "url" }))
                })()
            }),
            storage: fields({
                instanceOf: withFields({
                    name: string({ validation: "maxLength:500" })
                })()
            })
        })()
    }),
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
            home: string(),
            notFound: string(),
            error: string()
        })()
    })
})();
