import * as React from "react";
import { ButtonFloating } from "webiny-ui/Button";
import { Elevation } from "webiny-ui/Elevation";
import Element from "webiny-app-cms/render/components/Element";
import { updateChildPaths } from "webiny-app-cms/editor/utils";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import AutoScale from "./AutoScale";
import * as Styled from "./StyledComponents";

class BlockPreview extends React.Component {
    shouldComponentUpdate(props) {
        return props.plugin.name !== this.props.plugin.name;
    }

    render() {
        const { plugin, addBlockToContent, deactivatePlugin } = this.props;
        const block = plugin.create();
        block.path = "-1";

        updateChildPaths(block);

        return (
            <Elevation z={1} key={plugin.name}>
                <Styled.Block>
                    <Styled.Overlay>
                        <Styled.Backdrop className={"backdrop"} />
                        <Styled.AddBlock className={"add-block"}>
                            <ButtonFloating
                                label={"Click to Add"}
                                onClick={e => {
                                    addBlockToContent(plugin);
                                    !e.shiftKey &&
                                        deactivatePlugin({
                                            name: "cms-search-blocks-bar"
                                        });
                                }}
                                icon={<AddIcon />}
                            />
                        </Styled.AddBlock>
                    </Styled.Overlay>
                    <Styled.BlockPreview>
                        <AutoScale maxWidth={310} maxHeight={150}>
                            <Element element={block} />
                        </AutoScale>
                    </Styled.BlockPreview>
                </Styled.Block>
            </Elevation>
        );
    }
}

export default BlockPreview;
