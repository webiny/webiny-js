// @flow
import * as React from "react";
import { ImageEditor } from "webiny-ui/ImageEditor";

import { Dialog, DialogAccept, DialogCancel, DialogFooter, DialogBody } from "webiny-ui/Dialog";

// Each time ImageEditor makes a change, we store it here, so we can pass it to the onAccept callback.
let resultSrc = "";

type Props = Object & { src: ?string };
type State = { toolActive: boolean };

class ImageEditorDialog extends React.Component<Props, State> {
    state = { toolActive: false };
    render() {
        const { src, onAccept, ...dialogProps } = this.props;
        return (
            <Dialog {...dialogProps}>
                <DialogBody>
                    {src &&
                        dialogProps.open && (
                            <ImageEditor
                                src={src}
                                onChange={src => (resultSrc = src)}
                                onToolActivate={() => this.setState({ toolActive: true })}
                                onToolDeactivate={() => this.setState({ toolActive: false })}
                            />
                        )}
                </DialogBody>
                <DialogFooter>
                    <DialogCancel disabled={this.state.toolActive}>Cancel</DialogCancel>
                    <DialogAccept
                        disabled={this.state.toolActive}
                        onClick={() => onAccept(resultSrc)}
                    >
                        Save
                    </DialogAccept>
                </DialogFooter>
            </Dialog>
        );
    }
}
export default ImageEditorDialog;
