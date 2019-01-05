// @flow
import * as React from "react";
import BlockPreview from "./BlockPreview";

class BlocksList extends React.Component<*> {
    render() {
        const { blocks, onEdit, onDelete, deactivatePlugin, addBlock } = this.props;
        return (
            <>
                {blocks.map(plugin => (
                    <BlockPreview
                        key={plugin.name}
                        plugin={plugin}
                        onEdit={() => onEdit(plugin)}
                        onDelete={() => onDelete(plugin)}
                        addBlockToContent={addBlock}
                        deactivatePlugin={deactivatePlugin}
                    />
                ))}
            </>
        );
    }
}

export default BlocksList;
