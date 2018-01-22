import _ from "lodash";
import Immutable from "immutable";
import { Webiny } from "./../../../index";

function filterKey(contentState, entityKey) {
    if (entityKey) {
        const entity = contentState.getEntity(entityKey);
        return entity.getMutability() === "MUTABLE" ? entityKey : null;
    }
    return null;
}

class BasePlugin {
    constructor(config = {}) {
        this.name = "";
        this.config = config;
        this.editor = null;
        this.Draft = null;
    }

    /**
     * Method for a more convenient use of i18n module - this will automatically generate a complete namespace for the label
     * If this method is called without parameters, it will return Webiny.I18n module, from which you can use other functions as well
     * @param base
     * @param variables
     * @param options
     * @returns {*}
     */
    i18n(base, variables, options = {}) {
        if (!base) {
            return Webiny.I18n;
        }

        if (_.isString(base) && _.isString(variables)) {
            const textKey = Webiny.I18n.getTextKey(base, variables);
            return Webiny.I18n.render(textKey, variables, options);
        }

        const textKey = Webiny.I18n.getTextKey(options.namespace, base);
        return Webiny.I18n.render(textKey, base, variables);
    }

    // function borrowed from: https://github.com/draft-js-plugins/draft-js-plugins/blob/master/draft-js-dnd-plugin/src/modifiers/addBlock.js
    insertDataBlock(editorState, insertData = null) {
        const Draft = this.Draft;
        let type = "unstyled";
        let currentContentState = editorState.getCurrentContent();
        let currentSelectionState = editorState.getSelection();

        // in case text is selected it is removed and then the block is appended
        const afterRemovalContentState = Draft.Modifier.removeRange(
            currentContentState,
            currentSelectionState,
            "backward"
        );

        // deciding on the position to split the text
        const targetSelection = afterRemovalContentState.getSelectionAfter();
        const blockKeyForTarget = targetSelection.get("focusKey");
        const block = currentContentState.getBlockForKey(blockKeyForTarget);
        let insertionTargetSelection;
        let insertionTargetBlock;

        // In case there are no characters or entity or the selection is at the start it
        // is safe to insert the block in the current block.
        // Otherwise a new block is created (the block is always its own block)
        const isEmptyBlock = block.getLength() === 0 && block.getEntityAt(0) === null;
        const selectedFromStart = currentSelectionState.getStartOffset() === 0;
        if (isEmptyBlock || selectedFromStart) {
            insertionTargetSelection = targetSelection;
            insertionTargetBlock = afterRemovalContentState;
        } else {
            // the only way to insert a new seems to be by splitting an existing in two
            insertionTargetBlock = Draft.Modifier.splitBlock(
                afterRemovalContentState,
                targetSelection
            );
            // the position to insert our blocks
            insertionTargetSelection = insertionTargetBlock.getSelectionAfter();
        }

        const fragmentArray = [];

        if (insertData) {
            // creating a new ContentBlock including the entity with data
            // Entity will be created with a specific type, if defined, else will fall back to the ContentBlock type
            const { text, data, entity } = insertData;
            let characterList = Immutable.List();
            type = insertData.type;
            if (entity) {
                currentContentState = currentContentState.createEntity(
                    entity.type || type,
                    entity.mutability,
                    entity.data
                );
                const entityKey = currentContentState.getLastCreatedEntityKey();
                const charData = Draft.CharacterMetadata.create({ entity: entityKey });
                characterList = Immutable.List(Immutable.Repeat(charData, text.length || 1));
            }

            fragmentArray.push(
                new Draft.ContentBlock({
                    key: Draft.genKey(),
                    type,
                    text,
                    data,
                    characterList
                })
            );
        }

        // new content block so we can continue writing right away after inserting the block
        fragmentArray.push(
            new Draft.ContentBlock({
                key: Draft.genKey(),
                type: "unstyled",
                text: "",
                characterList: Immutable.List()
            })
        );

        const newContentStateAfterSplit = Draft.Modifier.setBlockType(
            insertionTargetBlock,
            insertionTargetSelection,
            type
        );
        // create fragment containing the two content blocks
        const fragment = Draft.BlockMapBuilder.createFromArray(fragmentArray);
        // replace the content block we reserved for our insert
        const contentStateWithBlock = Draft.Modifier.replaceWithFragment(
            newContentStateAfterSplit,
            insertionTargetSelection,
            fragment
        );
        // update editor state with our new state including the block
        const newState = Draft.EditorState.push(
            editorState,
            contentStateWithBlock,
            "insert-fragment"
        );
        return Draft.EditorState.forceSelection(
            newState,
            contentStateWithBlock.getSelectionAfter()
        );
    }

    getRangesForDraftEntity(block, key) {
        const ranges = [];
        block.findEntityRanges(
            c => {
                return c.getEntity() === key;
            },
            (start, end) => {
                ranges.push({ start, end });
            }
        );

        return ranges;
    }

    getEntityKeyForSelection(contentState, targetSelection) {
        let entityKey;

        if (targetSelection.isCollapsed()) {
            const key = targetSelection.getAnchorKey();
            const offset = targetSelection.getAnchorOffset();
            if (offset > 0) {
                entityKey = contentState.getBlockForKey(key).getEntityAt(offset - 1);
                return filterKey(contentState, entityKey);
            }
            return null;
        }

        const startKey = targetSelection.getStartKey();
        const startOffset = targetSelection.getStartOffset();
        const startBlock = contentState.getBlockForKey(startKey);

        entityKey =
            startOffset === startBlock.getLength() ? null : startBlock.getEntityAt(startOffset);

        return filterKey(contentState, entityKey);
    }

    getEntitySelectionState(contentState, selectionState, entityKey) {
        const Draft = this.Draft;
        const selectionKey = selectionState.getAnchorKey();
        const selectionOffset = selectionState.getAnchorOffset();
        const block = contentState.getBlockForKey(selectionKey);
        const blockKey = block.getKey();

        let entitySelection;
        this.getRangesForDraftEntity(block, entityKey).forEach(range => {
            if (range.start <= selectionOffset && selectionOffset <= range.end) {
                entitySelection = new Draft.SelectionState({
                    anchorOffset: range.start,
                    anchorKey: blockKey,
                    focusOffset: range.end,
                    focusKey: blockKey,
                    isBackward: false,
                    hasFocus: selectionState.getHasFocus()
                });
            }
        });
        return entitySelection;
    }

    getStartBlockType(defaultValue = null) {
        const editorState = this.editor.getEditorState();
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
        if (block) {
            return block.getType();
        }
        return defaultValue;
    }

    getStartBlock() {
        const editorState = this.editor.getEditorState();
        const selection = editorState.getSelection();
        const block = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
        return block || null;
    }

    isDisabled() {
        return this.editor.getReadOnly();
    }

    setConfig(config) {
        _.merge(this.config, config);
        return this;
    }

    setEditor(editor) {
        this.editor = editor;
        return this;
    }

    setDraft(Draft) {
        this.Draft = Draft;
        return this;
    }

    getEditConfig() {
        return _.clone({});
    }

    getPreviewConfig() {
        return _.clone(this.getEditConfig());
    }
}

export default BasePlugin;
