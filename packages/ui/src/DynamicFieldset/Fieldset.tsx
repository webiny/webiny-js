import * as React from "react";
import dotProp from "dot-prop-immutable";
import { FormElementMessage } from "~/FormElementMessage";
import styled from "@emotion/styled";

interface ChildrenRenderProp {
    actions: { add: Function; remove: Function };
    header: Function;
    row: Function;
    empty: Function;
}

interface FieldsetProps {
    value?: Array<Object>;
    description?: string;
    validation?: { isValid: null | boolean; message?: string };
    onChange?: Function;
    children: (props: ChildrenRenderProp) => React.ReactNode;
}

const DynamicFieldsetRow = styled("div")({
    paddingBottom: 10,
    "> .mdc-layout-grid": {
        padding: 0
    }
});

class Fieldset extends React.Component<FieldsetProps> {
    static defaultProps: Partial<FieldsetProps> = {
        value: [],
        description: null
    };

    header: React.ReactNode = null;
    rows: React.ReactNode = null;
    empty: React.ReactNode = null;

    actions = {
        add:
            (index = -1) =>
            () =>
                this.addData(index),
        remove:
            (index = -1) =>
            () =>
                this.removeData(index)
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
            return (
                <DynamicFieldsetRow key={index}>{cb({ data: record, index })}</DynamicFieldsetRow>
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
