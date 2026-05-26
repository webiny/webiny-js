"use client";
import { createLexicalInput } from "@webiny/website-builder-sdk";
import { createComponent } from "~/createComponent.js";
import { LexicalComponent, createLexicalValue } from "./Lexical.js";

export const Lexical = createComponent(LexicalComponent, {
    name: "Webiny/Lexical",
    label: "Rich Text",
    aiContext: "Rich text content. Generate semantic HTML tags. Do NOT generate markdown.",
    group: "basic",
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/><path d="M14 17H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
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
