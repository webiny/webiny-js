// @flow
import { flow } from "lodash";
import { withFields, setOnce } from "@commodo/fields";
import { string, fields } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { id } from "@commodo/fields-storage-mongodb/fields";
import { withStaticProps } from "repropose";

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
