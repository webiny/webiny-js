import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ColorPickerPlugin extends Webiny.Draft.InlineStylePlugin {
    constructor(config) {
        super(config);
        this.name = 'color-picker';
        this.style = 'noColor';
    }

    setColor(toggledColor) {
        const Draft = this.Draft;
        const editorState = this.editor.getEditorState();
        const selection = editorState.getSelection();

        // Turn off active color (loop through all available colors and remove inline style)
        const nextContentState = Object.keys(this.config.colors).reduce((contentState, color) => {
            return Draft.Modifier.removeInlineStyle(contentState, selection, color)
        }, editorState.getCurrentContent());

        let nextEditorState = Draft.EditorState.push(editorState, nextContentState, 'change-inline-style');

        const currentStyle = editorState.getCurrentInlineStyle();

        // Unset style override for current color.
        if (selection.isCollapsed()) {
            nextEditorState = currentStyle.reduce((state, color) => {
                return Draft.RichUtils.toggleInlineStyle(state, color);
            }, nextEditorState);
        }

        // If the color is being toggled on, apply it.
        if (!currentStyle.has(toggledColor) && toggledColor !== 'noColor') {
            nextEditorState = Draft.RichUtils.toggleInlineStyle(nextEditorState, toggledColor);
        }

        this.editor.setEditorState(nextEditorState);
    }

    getSelectedColor() {
        const editorState = this.editor.getEditorState();
        const selection = editorState.getSelection();
        const block = this.getStartBlock();
        if (block) {
            const styles = block.getInlineStyleAt(selection.getAnchorOffset());
            let activeStyle = null;
            Object.keys(this.config.colors).forEach(style => {
                if (styles.includes(style)) {
                    activeStyle = style;
                }
            });
            return activeStyle;
        }
        return null;
    }

    getDropdownTitle() {
        const activeStyle = this.getSelectedColor();
        if (activeStyle) {
            const color = this.config.colors[activeStyle];
            return <span style={{backgroundColor: color, display: 'block', width: 40, height: 10}}/>;
        }
        return 'No color';
    }

    getEditConfig() {
        const customStyleMap = {noColor: {color: 'inherit'}};
        _.map(this.config.colors, (color, name) => {
            customStyleMap[name] = {color};
        });

        return {
            toolbar: () => {
                const colors = this.config.colors;
                const emptyTitle = (
                    <span style={{border: '1px solid grey', display: 'block', width: '100%', height: 22, paddingLeft: 4}}>Clear color</span>
                );

                return (
                    <Webiny.Ui.LazyLoad modules={['Dropdown']}>
                        {({Dropdown}) => (
                            <Dropdown
                                className="color-picker, toolbar-dropdown"
                                title={this.getDropdownTitle()}
                                disabled={this.editor.getReadOnly()}
                                listStyle={{padding: 0}}>
                                <Dropdown.Link key="noColor" onClick={() => this.setColor('noColor')} title={emptyTitle}/>
                                {_.keys(colors).map(k => {
                                    const title = <span style={{backgroundColor: colors[k], display: 'block', width: '100%', height: 20}}/>;
                                    return <Dropdown.Link key={k} onClick={() => this.setColor(k)} title={title}/>
                                })}
                            </Dropdown>
                        )}
                    </Webiny.Ui.LazyLoad>
                );
            },
            customStyleMap
        };
    }
}

export default ColorPickerPlugin;