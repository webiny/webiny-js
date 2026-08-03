import React from "react";
import { observer } from "mobx-react-lite";
import { Alert, Button, Input, ProgressBar, Text } from "@webiny/admin-ui";
import type { ExtractionRepository } from "~/features/extraction/index.js";

/**
 * Generating a theme from a website — see the design brief, screens 3 and 4.
 *
 * Three states in one panel rather than three screens: the form, the progress, and the failure. They are
 * the same task at different moments, and swapping the whole dialog out would lose the URL the user typed
 * at exactly the point they most want to correct it.
 */

interface FormProps {
    url: string;
    name: string;
    onUrlChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onSubmit: () => void;
}

export const ExtractThemeForm = ({ url, name, onUrlChange, onNameChange, onSubmit }: FormProps) => (
    <div className="flex flex-col gap-md">
        <Input
            label="Website address"
            value={url}
            placeholder="https://example.com"
            autoFocus={true}
            onChange={onUrlChange}
            description="The homepage usually works best. We read a handful of pages and never sign in."
            onKeyDown={event => {
                if (event.key === "Enter") {
                    onSubmit();
                }
            }}
        />

        <Input
            label="Theme name"
            value={name}
            placeholder="e.g. Northbeam 2026"
            onChange={onNameChange}
        />

        {/* Set expectations before the wait, not during it. */}
        <Alert variant="subtle" type="info">
            This takes a few minutes. We read the site with a browser, work out its colours, type
            and spacing, and create a draft theme for you to review. Nothing goes live until you
            publish and activate it.
        </Alert>
    </div>
);

interface ProgressProps {
    extraction: ExtractionRepository.Interface;
}

export const ExtractThemeProgress = observer(({ extraction }: ProgressProps) => (
    <div className="flex flex-col gap-md">
        <ProgressBar value={extraction.percent} max={100} valuePosition="end" />

        {/* The step message names the page being read, which is what makes a long wait legible. */}
        <Text size="md" className="block text-neutral-strong">
            {extraction.message || "Working…"}
        </Text>

        <Alert variant="subtle" type="info">
            You can close this and keep working — we will let you know when the theme is ready.
        </Alert>
    </div>
));

export const ExtractThemeFailure = observer(({ extraction }: ProgressProps) => (
    <div className="flex flex-col gap-md">
        {/*
          The error text comes from the API and is written for this reader: it names what stopped us
          — a robots.txt rule, a CDN challenge, a page that renders nothing — and what to do about it.
          It is shown verbatim rather than replaced with a generic failure message.
        */}
        <Alert variant="strong" type="danger" title="Extraction did not finish">
            {extraction.error ?? "Something went wrong."}
        </Alert>

        <Text size="md" className="block text-neutral-strong">
            You can try a different page on the same site, or start from Webiny&apos;s defaults and
            adjust by hand.
        </Text>
    </div>
));

interface DoneProps {
    extraction: ExtractionRepository.Interface;
    onOpen: () => void;
}

export const ExtractThemeDone = observer(({ extraction, onOpen }: DoneProps) => (
    <div className="flex flex-col gap-md">
        <Alert variant="subtle" type="success" title="Your theme is ready">
            {extraction.summary ?? "A draft theme has been created from the site."}
        </Alert>

        {/*
          The model's own uncertainty, surfaced before the user opens the editor. This is the difference
          between "here is your theme" and "here is your theme, and these are the parts I guessed at" —
          and it is the whole reason `uncertain` is a required field in the model's answer.
        */}
        {extraction.uncertain.length > 0 && (
            <div className="flex flex-col gap-xs">
                <Text size="md" className="block font-semibold">
                    Worth checking ({extraction.uncertain.length})
                </Text>
                {extraction.uncertain.slice(0, 4).map(entry => (
                    <Text key={entry.path} size="sm" className="block text-neutral-strong">
                        <span className="font-mono">{entry.path}</span> — {entry.reason}
                    </Text>
                ))}
                {extraction.uncertain.length > 4 && (
                    <Text size="sm" className="block text-neutral-dimmed">
                        …and {extraction.uncertain.length - 4} more, listed in the editor.
                    </Text>
                )}
            </div>
        )}

        <div>
            <Button variant="primary" onClick={onOpen} text="Open the theme" />
        </div>
    </div>
));
