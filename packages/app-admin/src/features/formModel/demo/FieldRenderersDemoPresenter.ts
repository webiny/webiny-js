import { makeAutoObservable, toJS } from "mobx";
import type { IFormModel, IFormModelFactory, IFormVM, IFormError } from "../abstractions.js";

export interface FieldRenderersDemoVM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
    formErrors: IFormError[];
}

export class FieldRenderersDemoPresenter {
    private form: IFormModel;
    private lastSubmitted: Record<string, unknown> | null = null;
    private isSubmitting = false;

    constructor(formFactory: IFormModelFactory) {
        this.form = formFactory.create({
            fields: fields => ({
                // --- Text ---
                textInput: fields
                    .text()
                    .label("Text Input")
                    .placeholder("Type here...")
                    .required("Text input is required")
                    .description("Standard text input")
                    .help("Enter any text value")
                    .note("Max 255 characters"),
                textInputs: fields
                    .text()
                    .list()
                    .label("Text Inputs")
                    .renderer("textInputs", { addItemLabel: "Add text" })
                    .description("Add multiple text values")
                    .help("Each value is stored separately")
                    .note("Press Enter to add quickly"),
                tags: fields
                    .text()
                    .list()
                    .label("Tags")
                    .renderer("tags")
                    .placeholder("Add values")
                    .defaultValue([])
                    .description("Comma-separated tags")
                    .help("Type and press Enter to add a tag")
                    .note("Duplicates are ignored"),
                textarea: fields
                    .text()
                    .label("Textarea")
                    .renderer("textarea", { rows: 4 })
                    .description("Multi-line text area")
                    .help("Supports plain text only")
                    .note("Resizable vertically"),
                textareas: fields
                    .text()
                    .list()
                    .label("Descriptions")
                    .renderer("textareas", { addItemLabel: "Add description" })
                    .description("Multiple long text values")
                    .help("Each textarea is independent")
                    .note("Click add to append a new block"),

                // --- Number ---
                numberInput: fields
                    .number()
                    .label("Number")
                    .placeholder("0")
                    .required("Number is required")
                    .description("Single numeric value")
                    .help("Accepts integers and decimals")
                    .note("Use dot as decimal separator"),
                numberInputs: fields
                    .number()
                    .list()
                    .label("Number Inputs")
                    .renderer("numberInputs", { addItemLabel: "Add number" })
                    .description("Multiple numeric values")
                    .help("Each input accepts a number")
                    .note("Empty values are stored as empty strings"),
                numberOptions: fields
                    .number()
                    .list()
                    .label("Number Options")
                    .options([
                        { label: "Tier 1", value: 100 },
                        { label: "Tier 2", value: 200 }
                    ])
                    .description("Multiple numeric values")
                    .help("Each input accepts a number")
                    .note("Empty values are stored as empty strings"),

                // --- Boolean ---
                boolSwitch: fields
                    .boolean()
                    .label("Boolean Switch")
                    .description("Toggle on/off")
                    .help("Click to toggle state")
                    .note("Default is unchecked"),

                // --- Predefined Values ---
                dropdown: fields
                    .text()
                    .label("Dropdown")
                    .placeholder("Pick one")
                    .required("Dropdown selection is required")
                    .description("Single-select dropdown")
                    .help("Choose exactly one option")
                    .note("Required for form submission")
                    .options([
                        { label: "Option A", value: "a" },
                        { label: "Option B", value: "b" },
                        { label: "Option C", value: "c" }
                    ]),
                radioButtons: fields
                    .text()
                    .label("Radio Buttons")
                    .options([
                        { label: "Small", value: "sm" },
                        { label: "Medium", value: "md" },
                        { label: "Large", value: "lg" }
                    ])
                    .renderer("radioButtons")
                    .description("Pick a size variant")
                    .help("Only one option can be selected")
                    .note("Selection is mutually exclusive"),
                checkboxes: fields
                    .text()
                    .list()
                    .label("Checkboxes")
                    .options([
                        { label: "Read", value: "read" },
                        { label: "Write", value: "write" },
                        { label: "Admin", value: "admin" }
                    ])
                    .renderer("checkboxes")
                    .description("Multi-select permissions")
                    .help("Check all that apply")
                    .note("At least one is recommended"),

                // --- Date/Time ---
                dateOnly: fields
                    .datetime()
                    .label("Date Only")
                    .renderer("dateTimeInput", { type: "date" })
                    .description("Pick a calendar date")
                    .help("Format: YYYY-MM-DD")
                    .note("Time is not stored"),
                dateTime: fields
                    .datetime()
                    .label("Date & Time")
                    .renderer("dateTimeInput", { type: "dateTime" })
                    .description("Date with time of day")
                    .help("Stored without timezone")
                    .note("Seconds default to :00"),
                dateTimeTz: fields
                    .datetime()
                    .label("Date Time + Timezone")
                    .renderer("dateTimeInput", { type: "dateTimeTimezone" })
                    .description("Full date, time, and timezone")
                    .help("ISO 8601 with offset")
                    .note("Timezone defaults to your local zone"),
                timeOnly: fields
                    .datetime()
                    .label("Time Only")
                    .renderer("dateTimeInput", { type: "time" })
                    .description("Time without a date")
                    .help("Format: HH:MM:SS")
                    .note("24-hour format"),
                dateTimeList: fields
                    .datetime()
                    .list()
                    .label("Dates (multi)")
                    .renderer("dateTimeInputs", { type: "date" })
                    .description("Multiple date entries")
                    .help("Add as many dates as needed")
                    .note("Each date is independent"),

                // --- Hidden ---
                hiddenField: fields
                    .text()
                    .renderer("hidden")
                    .defaultValue("secret-value")
                    .description("Not visible in the UI")
                    .help("Carried in form data silently")
                    .note("Value is preset"),

                // --- Key-Value Tags ---
                metaTags: fields
                    .object()
                    .list()
                    .label("Meta Tags")
                    .description("Add SEO tags")
                    .renderer("keyValueTags", { addItemLabel: "Add tag" })
                    .fields(f => ({
                        name: f.text().placeholder("Name"),
                        content: f.text().placeholder("Content")
                    })),

                // --- Conditional Visibility / Disabled ---
                enableFeature: fields
                    .boolean()
                    .label("Enable Feature")
                    .description("Toggle this to show or hide the feature fields below"),
                featureName: fields
                    .text()
                    .label("Feature Name")
                    .placeholder("Name your feature...")
                    .rules([
                        {
                            type: "condition",
                            target: "enableFeature",
                            operator: "isFalsy",
                            value: null,
                            action: "hide"
                        }
                    ]),
                featureMode: fields
                    .text()
                    .label("Feature Mode")
                    .options([
                        { label: "Simple", value: "simple" },
                        { label: "Advanced", value: "advanced" }
                    ])
                    .rules([
                        {
                            type: "condition",
                            target: "enableFeature",
                            operator: "isFalsy",
                            value: null,
                            action: "hide"
                        }
                    ]),
                advancedConfig: fields
                    .text()
                    .label("Advanced Config")
                    .placeholder("JSON config...")
                    .renderer("textarea", { rows: 3 })
                    .description("Only editable in advanced mode")
                    .rules([
                        {
                            type: "condition",
                            target: "enableFeature",
                            operator: "isFalsy",
                            value: null,
                            action: "hide"
                        },
                        {
                            type: "condition",
                            target: "featureMode",
                            operator: "neq",
                            value: "advanced",
                            action: "disable"
                        }
                    ]),

                // --- Dynamic Zone (single template) ---
                contentBlock: fields
                    .object()
                    .label("Content Block")
                    .templates([
                        {
                            id: "hero",
                            name: "Hero Banner",
                            icon: {
                                type: "icon",
                                name: "fab/behance-square"
                            },
                            fields: f => ({
                                heading: f.text().label("Heading").required("Required"),
                                image: f.text().label("Image URL")
                            })
                        },
                        {
                            id: "text",
                            name: "Rich Text",
                            icon: {
                                type: "icon",
                                name: "fab/behance-square"
                            },
                            fields: f => ({
                                body: f.text().label("Body").renderer("textarea")
                            })
                        }
                    ]),

                // --- Dynamic Zone (multi-value template list) ---
                sections: fields
                    .object()
                    .list()
                    .label("Page Sections")
                    .renderer("dynamicZone", { container: false })
                    .templates([
                        {
                            id: "hero",
                            name: "Hero Banner",
                            icon: {
                                type: "icon",
                                name: "fab/behance-square"
                            },
                            fields: f => ({
                                heading: f.text().label("Heading"),
                                subheading: f.text().label("Subheading")
                            })
                        },
                        {
                            id: "cta",
                            name: "Call To Action",
                            icon: {
                                type: "icon",
                                name: "fab/behance-square"
                            },
                            fields: f => ({
                                label: f.text().label("Button Label"),
                                url: f.text().label("URL")
                            })
                        }
                    ])
            }),
            layout: layout => [
                layout.tabs({
                    id: "mainTabs",
                    tabs: [
                        {
                            id: "text",
                            label: "Text",
                            layout: l => [
                                l.row("textInput"),
                                l.row("textInputs"),
                                l.row("tags"),
                                l.row("textarea"),
                                l.row("textareas"),
                                l.row("metaTags")
                            ]
                        },
                        {
                            id: "numbers",
                            label: "Numbers & Boolean",
                            layout: l => [
                                l.row("numberInput"),
                                l.row("numberInputs"),
                                l.row("numberOptions"),
                                l.separator(),
                                l.row("boolSwitch")
                            ]
                        },
                        {
                            id: "selects",
                            label: "Selects",
                            layout: l => [l.row("dropdown", "radioButtons"), l.row("checkboxes")]
                        },
                        {
                            id: "datetime",
                            label: "Date / Time",
                            layout: l => [
                                l.row("dateOnly", "timeOnly"),
                                l.row("dateTime"),
                                l.row("dateTimeTz"),
                                l.row("dateTimeList")
                            ]
                        },
                        {
                            id: "rules",
                            label: "Rules",
                            layout: l => [
                                l.row("enableFeature"),
                                l.row("featureName", "featureMode"),
                                l.row("advancedConfig")
                            ]
                        },
                        {
                            id: "dynamic",
                            label: "Dynamic Zones",
                            layout: l => [
                                l.object("contentBlock", {
                                    hero: inner => [inner.row("heading"), inner.row("image")],
                                    text: inner => [inner.row("body")]
                                }),
                                l.object("sections", {
                                    hero: inner => [inner.row("heading", "subheading")],
                                    cta: inner => [inner.row("label", "url")]
                                })
                            ]
                        }
                    ]
                })
            ]
        });

        makeAutoObservable(this);
    }

    get vm(): FieldRenderersDemoVM {
        return {
            form: this.form.vm,
            data: toJS(this.form.getData()),
            lastSubmitted: this.lastSubmitted,
            isSubmitting: this.isSubmitting,
            formErrors: this.form.errors
        };
    }

    focusField(path: string): void {
        this.form.focusField(path);
    }

    async submit(): Promise<void> {
        this.isSubmitting = true;
        try {
            const result = await this.form.submit<Record<string, unknown>>();
            if (result !== false) {
                this.lastSubmitted = toJS(result);
            }
        } finally {
            this.isSubmitting = false;
        }
    }

    reset(): void {
        this.form.reset();
        this.lastSubmitted = null;
    }
}
