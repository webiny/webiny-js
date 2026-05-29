"use client";
import { createLexicalInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { LexicalComponent, createLexicalValue } from "./Lexical.js";

export const Lexical = createComponent(LexicalComponent, {
    name: "Webiny/Lexical",
    label: "Rich Text",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-160v-520H80v-120h520v120H400v520H280Zm360 0v-320H520v-120h360v120H760v320H640Z"/></svg>`,
    inputs: [
        createLexicalInput({
            name: "content",
            label: "Content"
        })
    ],
    defaults: {
        inputs: {
            content: createLexicalValue(
                "Examine she brother prudent add day ham. Far stairs now coming bed oppose hunted become his. You zealously departure had procuring suspicion. Books whose front would purse if be do decay. Quitting you way formerly disposed perceive ladyship are. Common turned boy direct and yet."
            )
        }
    }
});
