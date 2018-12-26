// @flow
import * as React from "react";
import { ButtonFloating, IconButton } from "webiny-ui/Button";
import { Elevation } from "webiny-ui/Elevation";
import { ReactComponent as AddIcon } from "webiny-app-cms/editor/assets/icons/add.svg";
import * as Styled from "./StyledComponents";
import { Typography } from "webiny-ui/Typography";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "./icons/round-close-24px.svg";
import { deleteElement } from "./BlockPreview/graphql";
import { Mutation } from "react-apollo";
import { Tooltip } from "webiny-ui/Tooltip";
import { withSnackbar } from "webiny-admin/components";
import { compose } from "recompose";
import { withSavedElements } from "webiny-app-cms/admin/components";
import { removePlugin } from "webiny-plugins";

class BlockPreview extends React.Component<*> {
    shouldComponentUpdate(props: Object) {
        return props.plugin.name !== this.props.plugin.name;
    }

    deleteBlock = async ({ plugin, update }) => {
        const { onDelete, showSnackbar } = this.props;
        const response = await update({
            variables: {
                id: plugin.id
            }
        });

        const { error } = response.data.cms.deleteElement;
        if (error) {
            showSnackbar(error.message);
            return;
        }

        removePlugin(plugin.name);
        showSnackbar("Block " + plugin.title + " successfully delete.");

        onDelete && onDelete();
    };

    render() {
        const { plugin, addBlockToContent, deactivatePlugin } = this.props;
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
                    <Styled.BlockPreview>{plugin.preview()}</Styled.BlockPreview>
                    <Styled.Title>
                        <Typography use={"overline"}>{plugin.title}</Typography>
                    </Styled.Title>
                    <Styled.DeleteBlock>
                        <ConfirmationDialog
                            title="Delete block"
                            message="Are you sure you want to delete this block?"
                        >
                            {({ showConfirmation }) => (
                                <Mutation mutation={deleteElement}>
                                    {update => {
                                        if (plugin.id) {
                                            return (
                                                <IconButton
                                                    icon={<DeleteIcon />}
                                                    onClick={() =>
                                                        showConfirmation(() =>
                                                            this.deleteBlock({ plugin, update })
                                                        )
                                                    }
                                                />
                                            );
                                        }

                                        return (
                                            <Tooltip content={"Cannot delete."} placement={"top"}>
                                                <IconButton disabled icon={<DeleteIcon />} />
                                            </Tooltip>
                                        );
                                    }}
                                </Mutation>
                            )}
                        </ConfirmationDialog>
                    </Styled.DeleteBlock>
                </Styled.Block>
            </Elevation>
        );
    }
}

export default compose(
    withSnackbar(),
    withSavedElements()
)(BlockPreview);
