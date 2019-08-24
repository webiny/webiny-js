// @flow
import * as React from "react";
import { ButtonFloating, IconButton } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as AddIcon } from "@webiny/app-page-builder/editor/assets/icons/add.svg";
import * as Styled from "./StyledComponents";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as EditIcon } from "./icons/round-edit-24px.svg";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as DeleteIcon } from "./icons/round-close-24px.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { isEqual } from "lodash";

class BlockPreview extends React.Component<*> {
    shouldComponentUpdate(props: Object) {
        return !isEqual(props.plugin, this.props.plugin);
    }

    render() {
        const {
            plugin,
            addBlockToContent,
            deactivatePlugin,
            onEdit,
            onDelete
        } = this.props;

        return (
            <Elevation z={1} key={plugin.name} className={Styled.blockStyle}>
                <Styled.Overlay>
                    <Styled.Backdrop className={"backdrop"} />
                    <Styled.AddBlock className={"add-block"}>
                        <ButtonFloating
                            label={"Click to Add"}
                            onClick={e => {
                                addBlockToContent(plugin);
                                !e.shiftKey &&
                                    deactivatePlugin({
                                        name: "pb-editor-search-blocks-bar"
                                    });
                            }}
                            icon={<AddIcon />}
                        />
                    </Styled.AddBlock>
                    {onDelete && (
                        <Styled.DeleteBlock>
                            <ConfirmationDialog
                                title="Delete block"
                                message="Are you sure you want to delete this block?"
                            >
                                {({ showConfirmation }) => (
                                    <>
                                        {plugin.id ? (
                                            <IconButton
                                                icon={<DeleteIcon />}
                                                onClick={() => showConfirmation(onDelete)}
                                            />
                                        ) : (
                                            <Tooltip content={"Cannot delete."} placement={"top"}>
                                                <IconButton disabled icon={<DeleteIcon />} />
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </ConfirmationDialog>
                        </Styled.DeleteBlock>
                    )}

                    {onEdit && (
                        <Styled.EditBlock>
                            {plugin.id ? (
                                <IconButton icon={<EditIcon />} onClick={onEdit} />
                            ) : (
                                <Tooltip content={"Cannot edit."} placement={"top"}>
                                    <IconButton disabled icon={<EditIcon />} />
                                </Tooltip>
                            )}
                        </Styled.EditBlock>
                    )}
                </Styled.Overlay>
                <Styled.BlockPreview>{plugin.preview()}</Styled.BlockPreview>
                <Styled.Title>
                    <Typography use={"overline"}>{plugin.title}</Typography>
                </Styled.Title>
            </Elevation>
        );
    }
}

export default BlockPreview;
