import React from 'react';
import {Webiny} from 'webiny-client';

class Alignment extends Webiny.Draft.BasePlugin {
    constructor(config) {
        super(config);
        this.name = 'alignment';
    }

    getEditConfig() {
        return {
            toolbar: () => {
                const buttons = [
                    {
                        align: 'left',
                        tooltip: 'Align block to the left'
                    },
                    {
                        align: 'center',
                        tooltip: 'Align block to the center'
                    },
                    {
                        align: 'right',
                        tooltip: 'Align block to the right'
                    },
                    {
                        align: 'justify',
                        tooltip: 'Justify content'
                    }
                ];

                return (
                    <actions>
                        {buttons.map(b => {
                            const block = this.getStartBlock();
                            let align = null;
                            if (block) {
                                align = block.getData().get('align');
                            }

                            const props = {
                                icon: 'fa-align-' + b.align,
                                tooltip: b.tooltip,
                                disabled: this.isDisabled(),
                                onClick: () => {
                                    if (align && align === b.align) {
                                        this.editor.updateBlockData(block, {align: null});
                                    } else {
                                        this.editor.updateBlockData(block, {align: b.align});
                                    }
                                },
                                type: align && align === b.align ? 'primary' : 'default',
                                plugin: this
                            };
                            return (
                                <Webiny.Ui.LazyLoad modules={['Button']} key={b.align}>
                                    {({Button}) => (
                                        <Button {...props}/>
                                    )}
                                </Webiny.Ui.LazyLoad>
                            );
                        })}
                    </actions>
                );
            },
            blockStyleFn: (contentBlock) => {
                const data = contentBlock.getData().toJS();
                if (data.align) {
                    return 'alignment--' + data.align;
                }
            }
        };
    }
}

export default Alignment;