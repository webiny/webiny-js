import { makeAutoObservable, toJS } from "mobx";
import type { IFormModel, IFormModelFactory, IFormVM } from "../abstractions.js";

export interface FieldRenderersDemoVM {
    form: IFormVM;
    data: Record<string, unknown>;
    lastSubmitted: Record<string, unknown> | null;
    isSubmitting: boolean;
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
                    .description("Standard text input")
                    .help("Enter any text value")
                    .note("Max 255 characters"),
                textInputs: fields
                    .text()
                    .list()
                    .label("Text Inputs")
                    .renderer("textInputs", { addValueButtonLabel: "Add text" })
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
                    .renderer("textareas", { addValueButtonLabel: "Add description" })
                    .description("Multiple long text values")
                    .help("Each textarea is independent")
                    .note("Click add to append a new block"),

                // --- Number ---
                numberInput: fields
                    .number()
                    .label("Number")
                    .placeholder("0")
                    .description("Single numeric value")
                    .help("Accepts integers and decimals")
                    .note("Use dot as decimal separator"),
                numberInputs: fields
                    .number()
                    .list()
                    .label("Number Inputs")
                    .renderer("numberInputs", { addValueButtonLabel: "Add number" })
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

                // --- Select / Predefined Values ---
                dropdown: fields
                    .select()
                    .label("Dropdown")
                    .placeholder("Pick one")
                    .description("Single-select dropdown")
                    .help("Choose exactly one option")
                    .note("Required for form submission")
                    .options([
                        { label: "Option A", value: "a" },
                        { label: "Option B", value: "b" },
                        { label: "Option C", value: "c" }
                    ]),
                radioButtons: fields
                    .select()
                    .label("Radio Buttons")
                    .renderer("radioButtons")
                    .description("Pick a size variant")
                    .help("Only one option can be selected")
                    .note("Selection is mutually exclusive")
                    .options([
                        { label: "Small", value: "sm" },
                        { label: "Medium", value: "md" },
                        { label: "Large", value: "lg" }
                    ]),
                checkboxes: fields
                    .select()
                    .list()
                    .label("Checkboxes")
                    .renderer("checkboxes")
                    .description("Multi-select permissions")
                    .help("Check all that apply")
                    .note("At least one is recommended")
                    .options([
                        { label: "Read", value: "read" },
                        { label: "Write", value: "write" },
                        { label: "Admin", value: "admin" }
                    ]),

                // --- Date/Time ---
                dateOnly: fields
                    .text()
                    .label("Date Only")
                    .renderer("dateTimeInput", { type: "date" })
                    .description("Pick a calendar date")
                    .help("Format: YYYY-MM-DD")
                    .note("Time is not stored"),
                dateTime: fields
                    .text()
                    .label("Date & Time")
                    .renderer("dateTimeInput", { type: "dateTime" })
                    .description("Date with time of day")
                    .help("Stored without timezone")
                    .note("Seconds default to :00"),
                dateTimeTz: fields
                    .text()
                    .label("Date Time + Timezone")
                    .renderer("dateTimeInput", { type: "dateTimeTimezone" })
                    .description("Full date, time, and timezone")
                    .help("ISO 8601 with offset")
                    .note("Timezone defaults to your local zone"),
                timeOnly: fields
                    .text()
                    .label("Time Only")
                    .renderer("dateTimeInput", { type: "time" })
                    .description("Time without a date")
                    .help("Format: HH:MM:SS")
                    .note("24-hour format"),
                dateTimeList: fields
                    .text()
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
                // Text
                layout.row("textInput"),
                layout.row("textInputs"),
                layout.row("tags"),
                layout.row("textarea"),
                layout.row("textareas"),
                layout.separator(),
                // Number
                layout.row("numberInput"),
                layout.row("numberInputs"),
                layout.separator(),
                // Boolean
                layout.row("boolSwitch"),
                layout.separator(),
                // Select / Predefined
                layout.row("dropdown", "radioButtons"),
                layout.row("checkboxes"),
                layout.separator(),
                // Date/Time
                layout.row("dateOnly", "timeOnly"),
                layout.row("dateTime"),
                layout.row("dateTimeTz"),
                layout.row("dateTimeList"),
                layout.separator(),
                // Dynamic Zone
                layout.object("contentBlock", {
                    hero: l => [l.row("heading"), l.row("image")],
                    text: l => [l.row("body")]
                }),
                layout.object("sections", {
                    hero: l => [l.row("heading", "subheading")],
                    cta: l => [l.row("label", "url")]
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
            isSubmitting: this.isSubmitting
        };
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
