// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { loadForm, emptyForm, submitForm } from "./../actions";
import _ from "lodash";
import type { WithFormParams } from "./withFormUtils/types";
import { getPropName, prepareLoadFormParams } from "./withFormUtils";

export default (withFormParams: WithFormParams): Function => {
    const propName = getPropName(withFormParams);

    return (BaseComponent: typeof React.Component) => {
        return compose(
            connect(
                state => ({
                    formState: _.get(state, `forms.${withFormParams.name}`)
                }),
                { loadForm, submitForm, emptyForm },
                (stateProps, dispatchProps, ownProps) => {
                    const returnProps = Object.assign({}, ownProps);

                    const { formState } = stateProps;
                    const formProps = {
                        ...formState,
                        submit({ data, onSuccess, onError }) {
                            dispatchProps.submitForm({
                                ...withFormParams,
                                data,
                                onSuccess,
                                onError
                            });
                        },
                        load() {
                            // Do not load if received "id" is the same as in form data.
                            // Possibly add "force" flag if this check needs to be skipped.
                            const id = {
                                store: formProps.data && formProps.data.id,
                                props: formProps.__loadParams.id
                            };

                            id.store !== id.props &&
                                dispatchProps.loadForm({ ...formProps.__loadParams });
                        },
                        empty() {
                            dispatchProps.emptyForm({ ...formProps.__loadParams });
                        },
                        init() {
                            formProps.__loadParams.id ? formProps.load() : formProps.empty();
                        },
                        __loadParams: prepareLoadFormParams(withFormParams, ownProps.route)
                    };
                    returnProps[propName] = formProps;

                    return returnProps;
                },
                {
                    areStatePropsEqual: (next, previous) => {
                        return _.isEqual(previous, next);
                    }
                }
            ),
            lifecycle({
                componentDidUpdate(prevProps) {
                    const params = {
                        prev: prevProps[propName].__loadParams,
                        next: this.props[propName].__loadParams
                    };

                    !_.isEqual(params.prev, params.next) && this.props[propName].init();
                },
                componentDidMount() {
                    this.props[propName].init();
                }
            })
        )(BaseComponent);
    };
};
