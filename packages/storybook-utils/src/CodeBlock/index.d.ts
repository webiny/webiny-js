import * as React from "react";
declare type Props = {
    copy?: boolean;
    lang?: string;
    children?: React.ReactNode;
};
declare type State = {
    copied: boolean;
};
declare class CodeBlock extends React.Component<Props, State> {
    state: {
        copied: boolean;
    };
    copy: (source: React.ReactNode) => void;
    render(): JSX.Element;
}
export default CodeBlock;
