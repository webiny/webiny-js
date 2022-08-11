import React from "react";
import dotProp from "dot-prop-immutable";
import { FormElementMessage } from "~/FormElementMessage";
import styled from "@emotion/styled";

interface ChildrenRenderPropRowCallableParams {
    index: number;
    data: any;
}
interface ChildrenRenderPropRowCallable {
    (params: ChildrenRenderPropRowCallableParams): React.ReactNode;
}

interface ChildrenRenderPropHeaderCallable {
    (): React.ReactNode;
}
interface ChildrenRenderPropEmptyCallable {
    (): React.ReactNode;
}
interface ChildrenRenderProp {
    actions: {
        add: Function;
        remove: Function;
    };
    header: (cb: ChildrenRenderPropHeaderCallable) => React.ReactNode;
    row: (cb: ChildrenRenderPropRowCallable) => React.ReactNode;
    empty: (cb: ChildrenRenderPropEmptyCallable) => React.ReactNode;
}

interface FieldsetProps {
    value?: any[];
    description?: string;
    validation?: { isValid: null | boolean; message?: string };
    onChange: Function;
    children: (props: ChildrenRenderProp) => React.ReactNode;
}

const DynamicFieldsetRow = styled("div")({
    paddingBottom: 10,
    "> .mdc-layout-grid": {
        padding: 0,
        "> .mdc-layout-grid__inner": {
            display: "block"
        }
    }
});

class Fieldset extends React.Component<FieldsetProps> {
    static defaultProps: Partial<FieldsetProps> = {
        value: []
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
        const { onChange } = this.props;
        let value = this.props.value;
        if (!value) {
            value = [];
        }
        if (index < 0) {
            onChange([...value, {}]);
        } else {
            onChange([...value.slice(0, index + 1), {}, ...value.slice(index + 1)]);
        }
    };

    renderHeader = (cb: () => React.ReactNode): React.ReactNode => {
        this.header = cb();
        return null;
    };

    renderRow = (cb: ChildrenRenderPropRowCallable): React.ReactNode => {
        const { value } = this.props;
        if (!value) {
            return null;
        }
        this.rows = value.map((record, index) => {
            return (
                <DynamicFieldsetRow key={index}>{cb({ data: record, index })}</DynamicFieldsetRow>
            );
        });
        return null;
    };

    renderEmpty = (cb: () => React.ReactNode): React.ReactNode => {
        this.empty = cb();
        return null;
    };

    public renderComponent(): React.ReactNode {
        const { value } = this.props;
        const { children } = this.props;

        children({
            actions: this.actions,
            header: this.renderHeader,
            row: this.renderRow,
            empty: this.renderEmpty
        });

        if (!value || value.length === 0) {
            return this.empty;
        }

        return (
            <React.Fragment>
                {this.header}
                {this.rows}
            </React.Fragment>
        );
    }

    public override render() {
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
