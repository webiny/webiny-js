import * as React from "react";
import dotProp from "dot-prop-immutable";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

interface ChildrenRenderProp {
    actions: { add: Function; remove: Function };
    header: Function;
    row: Function;
    empty: Function;
}

type FieldsetProps = {
    value: Array<Object>;
    description?: string;
    validation?: { isValid: null | boolean; message?: string };
    onChange: Function;
    children: (props: ChildrenRenderProp) => React.ReactNode;
};

class Fieldset extends React.Component<FieldsetProps> {
    static defaultProps = {
        value: [],
        description: null
    };

    header: React.ReactNode = null;
    rows: React.ReactNode = null;
    empty: React.ReactNode = null;

    actions = {
        add: (index = -1) => () => this.addData(index),
        remove: (index = -1) => () => this.removeData(index)
    };

    removeData = (index: number) => {
        const { value, onChange } = this.props;
        onChange(dotProp.delete(value, index));
    };

    addData = (index = -1) => {
        const { value, onChange } = this.props;
        if (index < 0) {
            onChange([...value, {}]);
        } else {
            onChange([...value.slice(0, index + 1), {}, ...value.slice(index + 1)]);
        }
    };

    renderHeader = (cb: () => React.ReactNode) => {
        this.header = cb();
    };

    renderRow = (cb: (params: Object) => React.ReactNode) => {
        const { value } = this.props;
        this.rows = value.map((record, index) => {
            return React.createElement(
                "webiny-dynamic-fieldset-row",
                { key: index },
                cb({ data: record, index })
            );
        });
    };

    renderEmpty = (cb: () => React.ReactNode) => {
        this.empty = cb();
    };

    renderComponent() {
        const { value } = this.props;
        const { children } = this.props;

        children({
            actions: this.actions,
            header: this.renderHeader,
            row: this.renderRow,
            empty: this.renderEmpty
        });

        if (value.length) {
            return (
                <React.Fragment>
                    {this.header}
                    {this.rows}
                </React.Fragment>
            );
        }

        return this.empty;
    }

    render() {
        const { description, validation = { isValid: null } } = this.props;

        return (
            <>
                {this.renderComponent()}
                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </>
        );
    }
}

export default Fieldset;
