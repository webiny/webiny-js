import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import {Webiny} from 'webiny-client';

class InlineToolbar extends Webiny.Ui.Component {
    componentDidUpdate() {
        super.componentDidMount();
        if (this.props.show) {
            const sel = this.getSelectionCoords(ReactDOM.findDOMNode(this.props.editor));
            if (sel) {
                const toolbar = $(ReactDOM.findDOMNode(this.refs.toolbar));
                let left = sel.left - (toolbar.width() / 2);
                if (left < -90) {
                    left = -90;
                }

                toolbar.css({left});
                const offset = toolbar.offset();
                const right = offset.left + toolbar.width();
                if (right >= document.documentElement.clientWidth) {
                    toolbar.css({left: left - (right - document.documentElement.clientWidth + 30)});
                }
            }
        }
    }

    getSelectionCoords(editor) {
        const {Draft} = this.props;
        const editorBounds = editor.getBoundingClientRect();
        const rangeBounds = Draft.getVisibleSelectionRect(window);

        if (!rangeBounds) {
            return null;
        }

        const rangeWidth = rangeBounds.right - rangeBounds.left;
        const left = (rangeBounds.left - editorBounds.left) + (rangeWidth / 2);
        const top = rangeBounds.top - editorBounds.top;
        return {left, top};
    }
}

InlineToolbar.defaultProps = {
    renderer() {
        const mouse = {
            onMouseDown: e => e.stopPropagation(),
            onClick: e => e.stopPropagation()
        };

        const {Animate} = this.props;

        return (
            <Animate
                trigger={this.props.show}
                show={{translateY: 25, opacity: 1, duration: 100}}
                hide={{translateY: -25, opacity: 0, duration: 100}}>
                <div className="editor-toolbar" ref="toolbar" {...mouse} style={{display: this.props.show ? 'flex' : 'none'}}>
                    {this.props.plugins.getToolbarActions().map((action, i) => {
                        return (
                            <span key={i} className="toolbar-action">
                                {React.isValidElement(action) ? React.cloneElement(action) : action()}
                            </span>
                        );
                    })}
                </div>
            </Animate>
        );
    }
};

export default Webiny.createComponent(InlineToolbar, {modules: ['Animate', {Draft: 'Webiny/Vendors/Draft'}]});