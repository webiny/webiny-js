// @flow
import { flow } from "lodash";
import { id } from "@commodo/fields-storage-mongodb/fields";
import { withStaticProps, withName, string, fields, withFields, setOnce } from "@webiny/commodo";

const SETTINGS_KEY = "page-builder";

export default ({ createBase }) => {
    return flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                return await this.findOne({ query: { key: SETTINGS_KEY } });
            }
        }),
        withFields({
            key: setOnce()(string({ value: SETTINGS_KEY })),
            data: fields({
                instanceOf: withFields({
                    pages: fields({
                        instanceOf: withFields({
                            home: id(),
                            notFound: id(),
                            error: id()
                        })()
                    }),
                    name: string(),
                    domain: string(),
                    favicon: id(),
                    logo: id(),
                    social: fields({
                        instanceOf: withFields({
                            facebook: string(),
                            twitter: string(),
                            instagram: string(),
                            image: id()
                        })()
                    })
                })()
            })
        })
    )(createBase());
};
