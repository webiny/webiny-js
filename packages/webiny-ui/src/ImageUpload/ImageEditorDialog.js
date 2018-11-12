// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";

import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

type Props = Object & { src: ?string };

class ImageEditorDialog extends React.Component<Props> {
    render() {
        const { src, onAccept, ...dialogProps } = this.props;
        return (
            <Dialog {...dialogProps}>
                {src && (
                    <ImageEditor src={src}>
                        {({ render, getCanvasDataUrl, hasActiveTool }) => (
                            <>
                                <DialogBody>{render()}</DialogBody>
                                <DialogFooter>
                                    <DialogCancel>Cancel</DialogCancel>
                                    <DialogAccept
                                        disabled={hasActiveTool}
                                        onClick={() => {
                                            onAccept(getCanvasDataUrl());
                                            //console.log('aaaa')
                                            //console.log(getCanvasDataUrl())*/
                                        }}
                                    >
                                        Save
                                    </DialogAccept>
                                </DialogFooter>
                            </>
                        )}
                    </ImageEditor>
                )}
            </Dialog>
        );
    }
}
export default ImageEditorDialog;
