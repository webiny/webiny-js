import React from "react";
import { RichTextStaticToolbarPreset } from "~/components/RitchTextStaticToolbarPreset";
import {LexicalEditorCmsConfiguration} from "~/components/LexicalEditorCmsConfiguration";
import {LexicalCmsConfigurationPreset} from "~/LexicalCmsConfigurationPreset";


export const LexicalEditorCmsPlugin = () => {
    return <>
           <RichTextStaticToolbarPreset />
           <LexicalEditorCmsConfiguration />
           <LexicalCmsConfigurationPreset />
        </>
}
