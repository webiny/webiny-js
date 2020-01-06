import * as React from "react";
import { FormComponentProps } from "./../types";
interface ChildrenRenderProp {
    onChange: (id: string | number) => () => void;
    getValue: (id: string | number) => boolean;
}
declare type Props = FormComponentProps & {
    label?: string;
    description?: string;
    children: (props: ChildrenRenderProp) => React.ReactNode;
};
declare class CheckboxGroup extends React.Component<Props> {
    render(): JSX.Element;
}
export default CheckboxGroup;
