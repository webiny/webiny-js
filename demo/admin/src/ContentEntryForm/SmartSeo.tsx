import React, { useState } from "react";
import OpenAI from "openai";
import { ReactComponent as MagicIcon } from "@material-design-icons/svg/round/school.svg";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { ButtonSecondary, ButtonIcon } from "@webiny/ui/Button";
import { FieldWithValue, useFieldTracker } from "./FieldTracker";
import { extractRichTextHtml } from "./extractFromRichText";
import { useSnackbar } from "@webiny/app-admin";

const OPENAI_API_KEY = String(process.env.REACT_APP_OPEN_AI_API_KEY);

const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });

const prompt = `You will be provided with one or more paragraphs of HTML, and you need to extract a SEO optimized page title, a page summary, and up to 5 keywords. Response should be returned as a plain JSON object, with "title" field for the page title, "description" field for page summary, and "keywords" field as an array of keywords.`;

const { Actions } = ContentEntryEditorConfig;

const populateSeoTitle = (fields: FieldWithValue[], value: string) => {
    const field = fields.find(field => field.type === "seoTitle");
    if (!field) {
        return;
    }

    field.onChange(value);
};

const populateSeoDescription = (fields: FieldWithValue[], value: string) => {
    const field = fields.find(field => field.type === "seoDescription");
    if (!field) {
        return;
    }

    field.onChange(value);
};

interface Tag {
    tagName: string;
    tagValue: string;
}

const populateSeoKeywords = (fields: FieldWithValue[], keywords: string[]) => {
    const field = fields.find(field => field.type === "seoMetaTags");
    if (!field) {
        console.warn("no meta tags field!");
        return;
    }
    const tags: Tag[] = Array.isArray(field.value) ? field.value : [];
    const tagsWithoutKeywords = tags.filter(tag => tag.tagName !== "keywords");

    field.onChange([
        ...tagsWithoutKeywords,
        { tagName: "keywords", tagValue: keywords.join(", ") }
    ]);
};

const GetSeoData = () => {
    const { showSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const { fields } = useFieldTracker();

    const askChatGpt = async () => {
        setLoading(true);
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: prompt
                },
                {
                    role: "user",
                    content: extractRichTextHtml(fields).join("\n")
                }
            ],
            temperature: 0.5,
            max_tokens: 128,
            top_p: 1
        });
        setLoading(false);

        console.log("ChatGPT response", response);
        try {
            // const seo = {
            //     title: "Node.js, Yarn, and AWS Setup Guide for Webiny",
            //     description:
            //         "Learn how to set up Node.js, yarn, and AWS account and user credentials for deploying Webiny. Make sure you have the required versions installed.",
            //     keywords: ["Node.js", "Yarn", "AWS", "Webiny", "setup"]
            // };
            const seo = JSON.parse(response.choices[0].message.content as string);
            console.log("parsed response", seo);
            populateSeoTitle(fields, seo.title);
            populateSeoDescription(fields, seo.description);
            populateSeoKeywords(fields, seo.keywords);
            showSnackbar("Success! We've populated the SEO fields with the recommended values.");
        } catch (e) {
            console.log(e);
            showSnackbar("We were unable to get a recommendation from AI at this point.");
        }
    };

    return (
        <ButtonSecondary onClick={() => askChatGpt()} disabled={loading}>
            <ButtonIcon icon={<MagicIcon />} /> AI-optimized SEO
        </ButtonSecondary>
    );
};

export const SmartSeo = () => {
    return (
        <Actions.ButtonAction
            name={"askAi"}
            before={"save"}
            element={<GetSeoData />}
            modelIds={["article"]}
        />
    );
};
