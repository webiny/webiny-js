// @flow
import { flow } from "lodash";
import { id } from "@commodo/fields-storage-mongodb/fields";
import {
    withStaticProps,
    withProps,
    withName,
    string,
    date,
    fields,
    withFields,
    setOnce,
    boolean
} from "@webiny/commodo";

const SETTINGS_KEY = "page-builder";

const step = () =>
    fields({
        value: {},
        instanceOf: flow(
            withFields({
                started: boolean({ value: false }),
                startedOn: date(),
                completed: boolean({ value: false }),
                completedOn: date()
            }),
            withProps({
                markAsStarted() {
                    this.started = true;
                    this.startedOn = new Date();
                },
                markAsCompleted() {
                    this.completed = true;
                    this.completedOn = new Date();
                }
            })
        )()
    });

export default ({ createBase, context }) => {
    const InstallationFields = flow(
        withFields({
            steps: fields({
                value: {},
                instanceOf: withFields({
                    step1: step(),
                    step2: step(),
                    step3: step(),
                    step4: step(),
                    step5: step()
                })()
            })
        }),
        withProps({
            stepAvailable(number) {
                if (number === 1) {
                    return !this.getStep(1).completed;
                }

                if (this.getStep(number).completed) {
                    return false;
                }

                return this.getStep(number - 1).completed;
            },
            getStep(number) {
                return this.steps["step" + number];
            },
            get completed() {
                for (let number = 1; number <= 5; number++) {
                    if (!this.getStep(number).completed) {
                        return false;
                    }
                }

                return true;
            }
        })
    )();

    const { id } = context.commodo.fields;

    return flow(
        withName("Settings"),
        withStaticProps({
            async load() {
                let settings = await this.findOne({ query: { key: SETTINGS_KEY } });
                if (!settings) {
                    settings = new this();
                    await settings.save();
                }
                return settings;
            }
        }),
        withFields({
            key: setOnce()(string({ value: SETTINGS_KEY })),
            data: fields({
                value: {},
                instanceOf: withFields({
                    pages: fields({
                        instanceOf: withFields({
                            home: id(),
                            notFound: id(),
                            error: id()
                        })()
                    }),
                    installation: fields({ instanceOf: InstallationFields, value: {} }),
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
