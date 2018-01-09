import React from 'react';
import ReactDOM from 'react-dom';
import {Webiny} from 'webiny-client';
import './styles.scss?extract';

class CodeHighlight extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('doHighlight');
    }

    componentDidMount() {
        this.doHighlight();
    }

    componentDidUpdate() {
        this.doHighlight();
    }

    doHighlight() {
        this.props.hljs.highlightBlock(ReactDOM.findDOMNode(this).querySelector('pre code'));
    }
}


CodeHighlight.defaultProps = {
    language: 'html',
    renderer() {
        return <pre><code className={this.props.language}>{this.props.children}</code></pre>;
    }
};

export default Webiny.createComponent(CodeHighlight, {modules: [{hljs: 'Webiny/Vendors/Highlight'}]});