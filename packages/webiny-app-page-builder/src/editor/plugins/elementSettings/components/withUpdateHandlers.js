// @flow
import { set } from "lodash";
import { connect } from "react-redux";
import { compose, withHandlers } from "recompose";
import { updateElement } from "webiny-app-page-builder/editor/actions";

export default ({ namespace }: Object) => {
    return compose(
        connect(
            null,
            { updateElement }
        ),
        withHandlers({
            updateSettings: ({ element, updateElement }: Object) => {
                let historyUpdated = {};
                return (name: string, newValue: mixed, history = false) => {
                    const propName = `${namespace}.${name}`;

                    let newElement = set(element, propName, newValue);

                    if (!history) {
                        updateElement({
                            element: newElement,
                            history,
                            merge: true
                        });
                        return;
                    }

                    if (historyUpdated[propName] !== newValue) {
                        historyUpdated[propName] = newValue;
                        updateElement({ element: newElement, merge: true });
                    }
                };
            }
        }),
        withHandlers({
            getUpdateValue: ({ updateSettings }: Object) => {
                const handlers = {};
                return (name: string) => {
                    if (!handlers[name]) {
                        return value => updateSettings(name, value, true);
                    }

                    return handlers[name];
                };
            },
            getUpdatePreview: ({ updateSettings }: Object) => {
                const handlers = {};
                return (name: string) => {
                    if (!handlers[name]) {
                        return value => updateSettings(name, value, false);
                    }

                    return handlers[name];
                };
            }
        })
    );
};
