// @flow
import * as React from "react";
import dotProp from "dot-prop-immutable";

type Props = {
    value: Array<Object>,
    onChange: Function,
    children: ({
        actions: { add: Function, remove: Function },
        header: Function,
        row: Function,
        empty: Function
    }) => React.Node
};

class Fieldset extends React.Component<Props> {
    static defaultProps = {
        value: []
    };

    header: React.Node = null;
    rows: React.Node = null;
    empty: React.Node = null;

    actions = {
        add: (index: number = -1) => () => this.addData(index),
        remove: (index: number = -1) => () => this.removeData(index)
    };

    removeData = (index: number) => {
        const { value, onChange } = this.props;
        onChange(dotProp.delete(value, index));
    };

    addData = (index: number = -1) => {
        const { value, onChange } = this.props;
        if (index < 0) {
            onChange([...value, {}]);
        } else {
            onChange([...value.slice(0, index + 1), {}, ...value.slice(index + 1)]);
        }
    };

    renderHeader = (cb: () => React.Node) => {
        this.header = cb();
    };

    renderRow = (cb: (params: Object) => React.Node) => {
        const { value } = this.props;
        this.rows = value.map((record, index) => {
            return (
                <webiny-dynamic-fieldset-row key={index}>
                    {cb({ data: record, index })}
                </webiny-dynamic-fieldset-row>
            );
        });
    };

    renderEmpty = (cb: () => React.Node) => {
        this.empty = cb();
    };

    render() {
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
}

export default Fieldset;
