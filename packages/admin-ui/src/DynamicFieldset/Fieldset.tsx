import React from "react";
import { FormComponentErrorMessage, FormComponentNote } from "~/FormComponent";

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
interface ChildrenRenderPropFooterCallable {
    (): React.ReactNode;
}

interface ChildrenRenderProp {
    actions: {
        add: (index?: number) => () => void;
        remove: (index: number) => () => void;
    };
    header: (cb: ChildrenRenderPropHeaderCallable) => React.ReactNode;
    footer: (cb: ChildrenRenderPropFooterCallable) => React.ReactNode;
    row: (cb: ChildrenRenderPropRowCallable) => React.ReactNode;
    empty: (cb: ChildrenRenderPropEmptyCallable) => React.ReactNode;
}

interface DynamicFieldsetProps {
    value?: any[];
    description?: string;
    validation?: { isValid: null | boolean; message?: string };
    onChange: (value: any) => void;
    children: (props: ChildrenRenderProp) => React.ReactNode;
}

class DynamicFieldset extends React.Component<DynamicFieldsetProps> {
    static defaultProps: Partial<DynamicFieldsetProps> = {
        value: []
    };

    header: React.ReactNode = null;
    footer: React.ReactNode = null;
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
        if (!value) {
            return;
        }
        onChange([...value.slice(0, index), ...value.slice(index + 1)]);
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

    renderFooter = (cb: () => React.ReactNode): React.ReactNode => {
        this.footer = cb();
        return null;
    };

    renderRow = (cb: ChildrenRenderPropRowCallable): React.ReactNode => {
        const { value } = this.props;
        if (!value) {
            return null;
        }
        this.rows = value.map((record, index) => {
            return <div key={index}>{cb({ data: record, index })}</div>;
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
            footer: this.renderFooter,
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
                {this.footer}
            </React.Fragment>
        );
    }

    public override render() {
        const { description, validation } = this.props;
        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <>
                {this.renderComponent()}
                <FormComponentErrorMessage
                    invalid={Boolean(validationIsValid === false)}
                    text={validationMessage}
                />
                <FormComponentNote text={description} />
            </>
        );
    }
}

export { DynamicFieldset, type DynamicFieldsetProps };
