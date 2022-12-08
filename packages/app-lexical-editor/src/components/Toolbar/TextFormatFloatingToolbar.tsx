/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

 import "./index.css";
 import { TOGGLE_LINK_COMMAND } from "@lexical/link";
 import { mergeRegister } from "@lexical/utils";
 import {
     $getSelection,
     COMMAND_PRIORITY_LOW,
     FORMAT_TEXT_COMMAND,
     LexicalEditor,
     SELECTION_CHANGE_COMMAND
 } from "lexical";
 import { useCallback, useEffect, useRef } from "react";
 import * as React from "react";
 
 import { getDOMRangeRect } from "../../utils/getDOMRangeRect";
 import { setFloatingElemPosition } from "../../utils/setFloatingElemPosition";
 
 function TextFormatFloatingToolbar({
     editor,
     anchorElem,
     isBold,
     isItalic,
 }: {
     editor: LexicalEditor;
     anchorElem: HTMLElement;
     isBold: boolean;
     isCode: boolean;
     isItalic: boolean;
 }): JSX.Element {
     const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
 
     const updateTextFormatFloatingToolbar = useCallback(() => {
         const selection = $getSelection();
 
         const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
         const nativeSelection = window.getSelection();
 
         if (popupCharStylesEditorElem === null) {
             return;
         }
 
         const rootElement = editor.getRootElement();
         if (
             selection !== null &&
             nativeSelection !== null &&
             !nativeSelection.isCollapsed &&
             rootElement !== null &&
             rootElement.contains(nativeSelection.anchorNode)
         ) {
             const rangeRect = getDOMRangeRect(nativeSelection, rootElement);
             setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
         }
     }, [editor, anchorElem]);
 
     useEffect(() => {
         const scrollerElem = anchorElem.parentElement;
 
         const update = () => {
             editor.getEditorState().read(() => {
                 updateTextFormatFloatingToolbar();
             });
         };
 
         window.addEventListener("resize", update);
         if (scrollerElem) {
             scrollerElem.addEventListener("scroll", update);
         }
 
         return () => {
             window.removeEventListener("resize", update);
             if (scrollerElem) {
                 scrollerElem.removeEventListener("scroll", update);
             }
         };
     }, [editor, updateTextFormatFloatingToolbar, anchorElem]);
 
     useEffect(() => {
         editor.getEditorState().read(() => {
             updateTextFormatFloatingToolbar();
         });
         return mergeRegister(
             editor.registerUpdateListener(({ editorState }) => {
                 editorState.read(() => {
                     updateTextFormatFloatingToolbar();
                 });
             }),
 
             editor.registerCommand(
                 SELECTION_CHANGE_COMMAND,
                 () => {
                     updateTextFormatFloatingToolbar();
                     return false;
                 },
                 COMMAND_PRIORITY_LOW
             )
         );
     }, [editor, updateTextFormatFloatingToolbar]);
 
     return (
         <div ref={popupCharStylesEditorRef} className="floating-text-format-popup">
             {editor.isEditable() && (
                 <>
                     <button
                         onClick={() => {
                             editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                         }}
                         className={"popup-item spaced " + (isBold ? "active" : "")}
                         aria-label="Format text as bold"
                     >
                         <i className="format bold" />
                     </button>
                 </>
             )}
         </div>
     );
 }
 