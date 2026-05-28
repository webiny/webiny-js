import React from "react";
import * as lexical from "lexical";
import { useRichTextEditor } from "webiny/admin/ui/lexical";
import * as CmsLexical from "webiny/admin/cms/lexical";
import * as WbLexical from "webiny/admin/website-builder/lexical";

type SerializedEmojiNode = lexical.Spread<{ className: string }, lexical.SerializedTextNode>;

function $createEmojiNode(className: string, text: string, key?: lexical.NodeKey): EmojiNode {
    return new EmojiNode(className, text, key);
}

class EmojiNode extends lexical.TextNode {
    __className: string;

    static override getType(): string {
        return "emoji";
    }

    static override clone(node: EmojiNode): EmojiNode {
        return new EmojiNode(node.__className, node.__text, node.__key);
    }

    constructor(className: string = "", text: string = "", key?: lexical.NodeKey) {
        super(text, key);
        this.__className = className;
    }

    override createDOM(config: lexical.EditorConfig): HTMLElement {
        const dom = document.createElement("span");
        const inner = super.createDOM(config);
        dom.className = this.__className;
        inner.className = "emoji-inner";
        dom.appendChild(inner);
        return dom;
    }

    static override importJSON(serializedNode: SerializedEmojiNode): EmojiNode {
        const node = $createEmojiNode(serializedNode.className, serializedNode.text);
        node.setFormat(serializedNode.format);
        node.setDetail(serializedNode.detail);
        node.setMode(serializedNode.mode);
        node.setStyle(serializedNode.style);
        return node;
    }
}

const INSERT_EMOJI_COMMAND = lexical.createCommand<string>();

const EmojiPlugin = () => {
    const { editor } = useRichTextEditor();

    React.useEffect(() => {
        return editor.registerCommand(
            INSERT_EMOJI_COMMAND,
            emojiText => {
                editor.update(() => {
                    const selection = lexical.$getSelection();
                    if (!lexical.$isRangeSelection(selection)) {
                        return;
                    }
                    selection.insertNodes([$createEmojiNode("emoji-test", emojiText)]);
                });
                return true;
            },
            lexical.COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
};

const InsertEmojiButton = () => {
    const { editor } = useRichTextEditor();

    return (
        <button
            type="button"
            className="popup-item spaced"
            onClick={() => editor.dispatchCommand(INSERT_EMOJI_COMMAND, "😀")}
            aria-label="Insert emoji"
            title="Insert emoji"
        >
            😀
        </button>
    );
};

export default () => {
    return (
        <>
            <WbLexical.LexicalEditorConfig.Expanded>
                <WbLexical.LexicalEditorConfig.Expanded.ToolbarAction
                    name="insertEmoji"
                    element={<InsertEmojiButton />}
                    after="link"
                />
                <WbLexical.LexicalEditorConfig.Expanded.Plugin
                    name="emojiPlugin"
                    element={<EmojiPlugin />}
                />
                <WbLexical.LexicalEditorConfig.Expanded.Node name={"emojiNode"} node={EmojiNode} />
            </WbLexical.LexicalEditorConfig.Expanded>

            <WbLexical.LexicalEditorConfig.Compact>
                <WbLexical.LexicalEditorConfig.Compact.Node name={"emojiNode"} node={EmojiNode} />
            </WbLexical.LexicalEditorConfig.Compact>

            <CmsLexical.LexicalEditorConfig>
                <CmsLexical.LexicalEditorConfig.ToolbarAction
                    name="insertEmoji"
                    element={<InsertEmojiButton />}
                    after="image"
                />
                <CmsLexical.LexicalEditorConfig.Plugin
                    name="emojiPlugin"
                    element={<EmojiPlugin />}
                />
                <CmsLexical.LexicalEditorConfig.Node name={"emojiNode"} node={EmojiNode} />
            </CmsLexical.LexicalEditorConfig>
        </>
    );
};
