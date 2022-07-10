import * as React from "react";
import { ButtonFloating, IconButton } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import { ReactComponent as AddIcon } from "~/editor/assets/icons/add.svg";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { ReactComponent as EditIcon } from "./icons/round-edit-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/delete-24dpx.svg";
import * as Styled from "./StyledComponents";
import kebabCase from "lodash/kebabCase";
import { PbEditorBlockPlugin } from "~/types";
import { useCallback } from "react";

interface BlockPreviewProps {
    plugin: PbEditorBlockPlugin;
    addBlockToContent: (plugin: PbEditorBlockPlugin) => void;
    onEdit: (ev: React.MouseEvent) => void;
    onDelete: (ev: React.MouseEvent) => void;
}
const BlockPreview: React.FC<BlockPreviewProps> = props => {
    const { plugin, addBlockToContent, onEdit, onDelete } = props;
    const onClickToAddHandler = useCallback(() => {
        addBlockToContent(plugin);
    }, [plugin]);
    return (
        <Elevation
            z={1}
            key={plugin.name}
            className={Styled.blockStyle}
            data-testid={`pb-editor-page-blocks-list-item-${kebabCase(plugin.title)}`}
        >
            <Styled.Overlay>
                <Styled.Backdrop className={"backdrop"} />
                <Styled.AddBlock className={"add-block"}>
                    <ButtonFloating
                        label={"Click to Add"}
                        onClick={() => onClickToAddHandler()}
                        icon={<AddIcon />}
                    />
                </Styled.AddBlock>
                {onDelete && (
                    <Styled.DeleteBlock>
                        <ConfirmationDialog
                            title="Delete block"
                            message="Are you sure you want to delete this block?"
                            loading={<CircularProgress label={"Deleting block..."} />}
                        >
                            {({ showConfirmation }) => (
                                <>
                                    {plugin.id ? (
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            onClick={ev => showConfirmation(() => onDelete(ev))}
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
};

BlockPreview.displayName = "BlockPreview";

export default BlockPreview;
