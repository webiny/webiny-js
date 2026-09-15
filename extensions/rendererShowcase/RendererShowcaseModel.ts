import { ModelFactory } from "webiny/api/cms/model";

export const RENDERER_SHOWCASE_MODEL_ID = "rendererShowcase";

class RendererShowcaseModelImpl implements ModelFactory.Interface {
    async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({
                    modelId: RENDERER_SHOWCASE_MODEL_ID,
                    name: "Renderer Showcase",
                    group: "ungrouped"
                })
                .description(
                    "Comprehensive test model covering all CMS field types, renderers, and configuration variants."
                )
                .fields(fields => ({
                    // ---------------------------------------------------------------
                    // TEXT FIELDS
                    // ---------------------------------------------------------------
                    textSingle: fields
                        .text()
                        .renderer("textInput")
                        .label("Text (single)")
                        .description(
                            "A basic single-value text field using the textInput renderer."
                        )
                        .help("Standard single-line text input")
                        .note("Renderer: textInput | Type: text | Cardinality: single")
                        .placeholder("Type something..."),

                    textMultiple: fields
                        .text()
                        .list()
                        .renderer("textInputs", { addItemLabel: "Add my text value" })
                        .label("Text (multiple)")
                        .description(
                            "A multi-value text field using the textInputs renderer with a custom add-item label."
                        )
                        .help("Add multiple text values, each in its own input")
                        .note("Renderer: textInputs | Type: text | Cardinality: list"),

                    textTags: fields
                        .text()
                        .list()
                        .renderer("tags")
                        .label("Tags")
                        .description(
                            "A multi-value text field rendered as a tag input for quick entry."
                        )
                        .help("Free-form comma-separated tags")
                        .note("Renderer: tags | Type: text | Cardinality: list"),

                    textDropdown: fields
                        .text()
                        .renderer("select")
                        .label("Dropdown (text)")
                        .description(
                            "A text field with predefined values rendered as a dropdown select."
                        )
                        .help("Select one option from the dropdown list")
                        .note("Renderer: dropdown | Type: text | Predefined values: a, b, c")
                        .predefinedValues([
                            { label: "Option A", value: "a" },
                            { label: "Option B", value: "b" },
                            { label: "Option C", value: "c" }
                        ]),

                    textRadioButtons: fields
                        .text()
                        .renderer("radioButtons")
                        .label("Radio Buttons (text)")
                        .description(
                            "A text field with predefined values rendered as radio buttons for single selection."
                        )
                        .help("Choose exactly one option")
                        .note(
                            "Renderer: radioButtons | Type: text | Predefined values: small, medium, large"
                        )
                        .predefinedValues([
                            { label: "Small", value: "small" },
                            { label: "Medium", value: "medium" },
                            { label: "Large", value: "large" }
                        ]),

                    textCheckboxes: fields
                        .text()
                        .list()
                        .renderer("checkboxes")
                        .label("Checkboxes (text)")
                        .description(
                            "A multi-value text field with predefined values rendered as checkboxes."
                        )
                        .help("Select one or more options")
                        .note(
                            "Renderer: checkboxes | Type: text | Predefined values: red, green, blue"
                        )
                        .predefinedValues([
                            { label: "Red", value: "red" },
                            { label: "Green", value: "green" },
                            { label: "Blue", value: "blue" }
                        ]),

                    // ---------------------------------------------------------------
                    // LONG TEXT FIELDS
                    // ---------------------------------------------------------------
                    longTextSingle: fields
                        .longText()
                        .renderer("textarea")
                        .label("Long Text (single)")
                        .description(
                            "A single-value long text field rendered as a multi-line textarea."
                        )
                        .help("Multi-line text area")
                        .note("Renderer: textarea | Type: longText | Cardinality: single"),

                    longTextMultiple: fields
                        .longText()
                        .list()
                        .renderer("textareas", { addItemLabel: "Add paragraph" })
                        .label("Long Text (multiple)")
                        .description(
                            "A multi-value long text field using the textareas renderer with a custom add-item label."
                        )
                        .help("Add multiple paragraphs of text")
                        .note("Renderer: textareas | Type: longText | Cardinality: list"),

                    // ---------------------------------------------------------------
                    // RICH TEXT FIELDS
                    // ---------------------------------------------------------------
                    richTextSingle: fields
                        .richText()
                        .renderer("lexicalEditor")
                        .label("Rich Text (single)")
                        .description("A single-value rich text field using the Lexical editor.")
                        .help("Use the toolbar to format text, add links, and insert media")
                        .note("Renderer: lexicalEditor | Type: richText | Cardinality: single"),

                    richTextMultiple: fields
                        .richText()
                        .list()
                        .renderer("lexicalEditors", { addItemLabel: "Add rich text block" })
                        .label("Rich Text (multiple)")
                        .description(
                            "A multi-value rich text field with multiple Lexical editor instances."
                        )
                        .help("Add multiple rich text blocks, each with its own editor")
                        .note("Renderer: lexicalEditors | Type: richText | Cardinality: list"),

                    // ---------------------------------------------------------------
                    // NUMBER FIELDS
                    // ---------------------------------------------------------------
                    numberSingle: fields
                        .number()
                        .renderer("numberInput")
                        .label("Number (single)")
                        .description("A single-value number field with a minimum value validation.")
                        .help("Enter a non-negative number")
                        .note("Renderer: numberInput | Type: number | Validation: gte(0)")
                        .gte(0, "Must be non-negative"),

                    numberMultiple: fields
                        .number()
                        .list()
                        .renderer("numberInputs", { addItemLabel: "Add number" })
                        .label("Number (multiple)")
                        .description("A multi-value number field using the numberInputs renderer.")
                        .help("Add multiple numeric values")
                        .note("Renderer: numberInputs | Type: number | Cardinality: list"),

                    numberDropdown: fields
                        .number()
                        .renderer("select")
                        .label("Dropdown (number)")
                        .description(
                            "A number field with predefined values rendered as a dropdown select."
                        )
                        .help("Select a quantity from the dropdown")
                        .note("Renderer: dropdown | Type: number | Predefined values: 10, 25, 50")
                        .predefinedValues([
                            { label: "10 items", value: "10" },
                            { label: "25 items", value: "25" },
                            { label: "50 items", value: "50" }
                        ]),

                    numberRadioButtons: fields
                        .number()
                        .renderer("radioButtons")
                        .label("Radio Buttons (number)")
                        .description(
                            "A number field with predefined values rendered as radio buttons."
                        )
                        .help("Choose a priority level")
                        .note("Renderer: radioButtons | Type: number | Predefined values: 1, 5, 10")
                        .predefinedValues([
                            { label: "Low (1)", value: "1" },
                            { label: "Medium (5)", value: "5" },
                            { label: "High (10)", value: "10" }
                        ]),

                    numberCheckboxes: fields
                        .number()
                        .list()
                        .renderer("checkboxes")
                        .label("Checkboxes (number)")
                        .description(
                            "A multi-value number field with predefined values rendered as checkboxes."
                        )
                        .help("Select one or more numeric values")
                        .note(
                            "Renderer: checkboxes | Type: number | Predefined values: 100, 200, 300"
                        )
                        .predefinedValues([
                            { label: "100", value: "100" },
                            { label: "200", value: "200" },
                            { label: "300", value: "300" }
                        ]),

                    // ---------------------------------------------------------------
                    // BOOLEAN FIELD
                    // ---------------------------------------------------------------
                    booleanSwitch: fields
                        .boolean()
                        .renderer("switch")
                        .label("Boolean Switch")
                        .description("A boolean field rendered as a toggle switch.")
                        .help("Toggle on or off")
                        .note("Renderer: switch | Type: boolean | Cardinality: single"),

                    // ---------------------------------------------------------------
                    // DATETIME FIELDS
                    // ---------------------------------------------------------------
                    dateTimeSingle: fields
                        .datetime()
                        .renderer("dateTimeInput")
                        .label("DateTime (single)")
                        .description("A single-value datetime field with date and time pickers.")
                        .help("Pick a date and time")
                        .note("Renderer: dateTimeInput | Type: datetime | Cardinality: single"),

                    dateTimeMultiple: fields
                        .datetime()
                        .list()
                        .renderer("dateTimeInputs", { addItemLabel: "Add date" })
                        .label("DateTime (multiple)")
                        .description(
                            "A multi-value datetime field using the dateTimeInputs renderer."
                        )
                        .help("Add multiple date-time entries")
                        .note("Renderer: dateTimeInputs | Type: datetime | Cardinality: list"),

                    dateOnly: fields
                        .datetime()
                        .dateOnly()
                        .renderer("dateTimeInput")
                        .label("Date Only")
                        .description(
                            "A datetime field configured to capture only the date portion."
                        )
                        .help("Pick a date (no time component)")
                        .note("Renderer: dateTimeInput | Type: datetime | Mode: dateOnly"),

                    timeOnly: fields
                        .datetime()
                        .timeOnly()
                        .renderer("dateTimeInput")
                        .label("Time Only")
                        .description(
                            "A datetime field configured to capture only the time portion."
                        )
                        .help("Pick a time (no date component)")
                        .note("Renderer: dateTimeInput | Type: datetime | Mode: timeOnly"),

                    dateTimeWithTimezone: fields
                        .datetime()
                        .withTimezone()
                        .renderer("dateTimeInput")
                        .label("DateTime with Timezone")
                        .description(
                            "A datetime field that stores the value with timezone information."
                        )
                        .help("Pick a date and time; the timezone is stored alongside the value")
                        .note("Renderer: dateTimeInput | Type: datetime | Timezone: included"),

                    dateTimeWithoutTimezone: fields
                        .datetime()
                        .withoutTimezone()
                        .renderer("dateTimeInput")
                        .label("DateTime without Timezone")
                        .description(
                            "A datetime field that stores the value without timezone information."
                        )
                        .help("Pick a date and time; no timezone is stored")
                        .note("Renderer: dateTimeInput | Type: datetime | Timezone: excluded"),

                    // ---------------------------------------------------------------
                    // FILE FIELDS
                    // ---------------------------------------------------------------
                    fileSingle: fields
                        .file()
                        .renderer("file")
                        .label("File (single)")
                        .description("A single-value file field that accepts any file type.")
                        .help("Any file type")
                        .note("Renderer: file | Type: file | Cardinality: single"),

                    fileSingleImagesOnly: fields
                        .file()
                        .imagesOnly()
                        .renderer("file", { imagesOnly: true })
                        .label("Image (single)")
                        .description("A single-value file field restricted to image files only.")
                        .help("Images only")
                        .note(
                            "Renderer: file | Type: file | Cardinality: single | imagesOnly: true"
                        ),

                    fileMultiple: fields
                        .file()
                        .list()
                        .renderer("files")
                        .label("Files (multiple)")
                        .description("A multi-value file field that accepts any file type.")
                        .help("Upload or select multiple files")
                        .note("Renderer: files | Type: file | Cardinality: list"),

                    fileMultipleImagesOnly: fields
                        .file()
                        .list()
                        .imagesOnly()
                        .renderer("files", { imagesOnly: true })
                        .label("Images (multiple)")
                        .description("A multi-value file field restricted to image files only.")
                        .help("Upload or select multiple images")
                        .note(
                            "Renderer: files | Type: file | Cardinality: list | imagesOnly: true"
                        ),

                    // ---------------------------------------------------------------
                    // REFERENCE FIELDS
                    // ---------------------------------------------------------------
                    refDialogSingle: fields
                        .ref()
                        .renderer("refDialogSingle")
                        .label("Ref Dialog (single)")
                        .description(
                            "A single-value reference field using a dialog picker to select an entry."
                        )
                        .help("Click to open a dialog and select a product")
                        .note("Renderer: refDialogSingle | Type: ref | Model: product")
                        .models([{ modelId: "product" }]),

                    refDialogMultiple: fields
                        .ref()
                        .list()
                        .renderer("refDialogMultiple")
                        .label("Ref Dialog (multiple)")
                        .description(
                            "A multi-value reference field using a dialog picker to select entries."
                        )
                        .help("Click to open a dialog and select multiple products")
                        .note(
                            "Renderer: refDialogMultiple | Type: ref | Model: product | Cardinality: list"
                        )
                        .models([{ modelId: "product" }]),

                    refAutocompleteSingle: fields
                        .ref()
                        .renderer("refAutocompleteSingle")
                        .label("Ref Autocomplete (single)")
                        .description(
                            "A single-value reference field with an autocomplete search input."
                        )
                        .help("Start typing to search and select a product")
                        .note("Renderer: refAutocompleteSingle | Type: ref | Model: product")
                        .models([{ modelId: "product" }]),

                    refAutocompleteMultiple: fields
                        .ref()
                        .list()
                        .renderer("refAutocompleteMultiple")
                        .label("Ref Autocomplete (multiple)")
                        .description(
                            "A multi-value reference field with an autocomplete search input."
                        )
                        .help("Start typing to search and select multiple products")
                        .note(
                            "Renderer: refAutocompleteMultiple | Type: ref | Model: product | Cardinality: list"
                        )
                        .models([{ modelId: "product" }]),

                    refRadioButtons: fields
                        .ref()
                        .renderer("refRadioButtons")
                        .label("Ref Radio Buttons")
                        .description("A single-value reference field rendered as radio buttons.")
                        .help("Choose one product category")
                        .note("Renderer: refRadioButtons | Type: ref | Model: productCategory")
                        .models([{ modelId: "productCategory" }]),

                    refCheckboxes: fields
                        .ref()
                        .list()
                        .renderer("refCheckboxes")
                        .label("Ref Checkboxes")
                        .description("A multi-value reference field rendered as checkboxes.")
                        .help("Select one or more product categories")
                        .note(
                            "Renderer: refCheckboxes | Type: ref | Model: productCategory | Cardinality: list"
                        )
                        .models([{ modelId: "productCategory" }]),

                    // ---------------------------------------------------------------
                    // OBJECT FIELDS
                    // ---------------------------------------------------------------
                    objectSingle: fields
                        .object()
                        .renderer("objectAccordionSingle")
                        .label("Object (accordion single)")
                        .description("A single object field rendered as an expandable accordion.")
                        .help("Expand to edit the nested fields")
                        .note(
                            "Renderer: objectAccordionSingle | Type: object | Fields: firstName, lastName, age"
                        )
                        .fields(f => ({
                            firstName: f.text().renderer("textInput").label("First Name"),
                            lastName: f.text().renderer("textInput").label("Last Name"),
                            age: f.number().renderer("numberInput").label("Age")
                        }))
                        .layout([["firstName", "lastName"], ["age"]]),

                    objectSingleOpen: fields
                        .object()
                        .renderer("objectAccordionSingle", { open: false })
                        .label("Object (collapsed by default)")
                        .description(
                            "A single object accordion that starts collapsed (open: false)."
                        )
                        .help("Click the header to expand and edit")
                        .note("Renderer: objectAccordionSingle | Type: object | Option: open=false")
                        .fields(f => ({
                            note: f.longText().renderer("textarea").label("Note")
                        }))
                        .layout([["note"]]),

                    objectSingleNoContainer: fields
                        .object()
                        .renderer("objectAccordionSingle", { container: false })
                        .label("Object (no container)")
                        .description("A single object accordion without a visual container border.")
                        .help("Fields are rendered inline without a surrounding box")
                        .note(
                            "Renderer: objectAccordionSingle | Type: object | Option: container=false"
                        )
                        .fields(f => ({
                            inlineField: f.text().renderer("textInput").label("Inline Field")
                        }))
                        .layout([["inlineField"]]),

                    objectSingleItemTitle: fields
                        .object()
                        .renderer("objectAccordionSingle", { itemTitle: "heading" })
                        .label("Object (custom title from field)")
                        .description(
                            "A single object accordion whose header displays the value of a nested field."
                        )
                        .help("The accordion title updates to match the Heading field value")
                        .note(
                            "Renderer: objectAccordionSingle | Type: object | Option: itemTitle=heading"
                        )
                        .fields(f => ({
                            heading: f.text().renderer("textInput").label("Heading"),
                            body: f.longText().renderer("textarea").label("Body")
                        }))
                        .layout([["heading"], ["body"]]),

                    objectMultiple: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple", { addItemLabel: "Add person" })
                        .label("Object (accordion multiple)")
                        .description(
                            "A repeatable object field rendered as multiple accordion items."
                        )
                        .help("Add and manage multiple person entries")
                        .note(
                            "Renderer: objectAccordionMultiple | Type: object | Cardinality: list"
                        )
                        .fields(f => ({
                            uuid: f.text().renderer("textInput").label("UUID").tags(["uuid"]),
                            name: f.text().renderer("textInput").label("Name"),
                            email: f.text().renderer("textInput").label("Email")
                        }))
                        .layout([["uuid"], ["name", "email"]]),

                    objectMultipleNoContainer: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple", {
                            container: false,
                            addItemLabel: "Add entry"
                        })
                        .label("Object Multiple (no container)")
                        .description(
                            "A repeatable object accordion without a visual container border."
                        )
                        .help("Items are rendered inline without a surrounding box")
                        .note(
                            "Renderer: objectAccordionMultiple | Type: object | Options: container=false, list"
                        )
                        .fields(f => ({
                            value: f.text().renderer("textInput").label("Value")
                        }))
                        .layout([["value"]]),

                    objectMultipleItemTitle: fields
                        .object()
                        .list()
                        .renderer("objectAccordionMultiple", {
                            itemTitle: "title",
                            itemDescription: "description",
                            addItemLabel: "Add item"
                        })
                        .label("Object Multiple (custom item title)")
                        .description(
                            "A repeatable object accordion where each item header shows a nested field value."
                        )
                        .help("Each accordion item title updates to match its Title field value")
                        .note(
                            "Renderer: objectAccordionMultiple | Type: object | Options: itemTitle=title, list"
                        )
                        .fields(f => ({
                            title: f.text().renderer("textInput").label("Title"),
                            description: f.longText().renderer("textarea").label("Description")
                        }))
                        .layout([["title"], ["description"]]),

                    objectPassthrough: fields
                        .object()
                        .renderer("passthrough")
                        .label("Object (passthrough)")
                        .description(
                            "An object field using the passthrough renderer that renders children directly without a wrapper."
                        )
                        .help("Nested fields appear inline in the parent layout")
                        .note("Renderer: passthrough | Type: object | No visual wrapper")
                        .fields(f => ({
                            inlineA: f.text().renderer("textInput").label("Inline A"),
                            inlineB: f.text().renderer("textInput").label("Inline B")
                        }))
                        .layout([["inlineA", "inlineB"]]),

                    // ---------------------------------------------------------------
                    // DYNAMIC ZONE FIELDS
                    // ---------------------------------------------------------------
                    dynamicZoneSingle: fields
                        .dynamicZone()
                        .renderer("dynamicZone")
                        .label("Dynamic Zone (single)")
                        .description(
                            "A single-value dynamic zone field with selectable content templates."
                        )
                        .help("Choose a template to define this section's content structure")
                        .note(
                            "Renderer: dynamicZone | Type: dynamicZone | Templates: hero, richContent"
                        )
                        .template("hero", {
                            name: "Hero Banner",
                            gqlTypeName: "ShowcaseHero",
                            description: "A hero section with heading and image",
                            fields: f => ({
                                heading: f.text().renderer("textInput").label("Heading"),
                                subheading: f.longText().renderer("textarea").label("Subheading"),
                                image: f.file().imagesOnly().renderer("file").label("Image")
                            }),
                            layout: [["heading"], ["subheading"], ["image"]]
                        })
                        .template("richContent", {
                            name: "Rich Content",
                            gqlTypeName: "ShowcaseRichContent",
                            description: "A rich text content block",
                            fields: f => ({
                                content: f.richText().renderer("lexicalEditor").label("Content")
                            }),
                            layout: [["content"]]
                        }),

                    dynamicZoneList: fields
                        .dynamicZone()
                        .list()
                        .renderer("dynamicZone")
                        .label("Dynamic Zone (list)")
                        .description(
                            "A repeatable dynamic zone field allowing multiple template-based content blocks."
                        )
                        .help("Add multiple content blocks, each from a different template")
                        .note(
                            "Renderer: dynamicZone | Type: dynamicZone | Cardinality: list | Templates: textBlock, imageGallery, faq"
                        )
                        .template("textBlock", {
                            name: "Text Block",
                            gqlTypeName: "ShowcaseTextBlock",
                            description: "Simple text section",
                            fields: f => ({
                                uuid: f.text().renderer("textInput").label("UUID").tags(["uuid"]),
                                title: f.text().renderer("textInput").label("Title"),
                                body: f.longText().renderer("textarea").label("Body")
                            }),
                            layout: [["uuid"], ["title"], ["body"]]
                        })
                        .template("imageGallery", {
                            name: "Image Gallery",
                            gqlTypeName: "ShowcaseImageGallery",
                            description: "A gallery of images",
                            fields: f => ({
                                uuid: f.text().renderer("textInput").label("UUID").tags(["uuid"]),
                                caption: f.text().renderer("textInput").label("Caption"),
                                images: f
                                    .file()
                                    .list()
                                    .imagesOnly()
                                    .renderer("files", { imagesOnly: true })
                                    .label("Images")
                            }),
                            layout: [["uuid"], ["caption"], ["images"]]
                        })
                        .template("faq", {
                            name: "FAQ",
                            gqlTypeName: "ShowcaseFaq",
                            description: "Questions and answers",
                            fields: f => ({
                                items: f
                                    .object()
                                    .list()
                                    .renderer("objectAccordionMultiple", {
                                        itemTitle: "question",
                                        addItemLabel: "Add Q&A"
                                    })
                                    .label("Q&A Items")
                                    .fields(qa => ({
                                        question: qa.text().renderer("textInput").label("Question"),
                                        answer: qa
                                            .richText()
                                            .renderer("lexicalEditor")
                                            .label("Answer")
                                    }))
                                    .layout([["question"], ["answer"]])
                            }),
                            layout: [["items"]]
                        }),

                    // ---------------------------------------------------------------
                    // HIDDEN FIELD
                    // ---------------------------------------------------------------
                    hiddenMeta: fields
                        .text()
                        .renderer("hidden")
                        .label("Hidden Metadata")
                        .description(
                            "A text field using the hidden renderer, invisible in the form UI."
                        )
                        .help("This field is not displayed to editors")
                        .note("Renderer: hidden | Type: text | Default: auto-generated")
                        .defaultValue("auto-generated")
                }))
                .layout([
                    // Text renderers
                    ["textSingle"],
                    ["textMultiple"],
                    ["textTags"],
                    ["textDropdown", "textRadioButtons"],
                    ["textCheckboxes"],
                    // Long text renderers
                    ["longTextSingle"],
                    ["longTextMultiple"],
                    // Rich text renderers
                    ["richTextSingle"],
                    ["richTextMultiple"],
                    // Number renderers
                    ["numberSingle"],
                    ["numberMultiple"],
                    ["numberDropdown", "numberRadioButtons"],
                    ["numberCheckboxes"],
                    // Boolean
                    ["booleanSwitch"],
                    // DateTime renderers
                    ["dateTimeSingle", "dateTimeMultiple"],
                    ["dateOnly", "timeOnly"],
                    ["dateTimeWithTimezone", "dateTimeWithoutTimezone"],
                    // File renderers
                    ["fileSingle", "fileSingleImagesOnly"],
                    ["fileMultiple", "fileMultipleImagesOnly"],
                    // Reference renderers
                    ["refDialogSingle", "refDialogMultiple"],
                    ["refAutocompleteSingle", "refAutocompleteMultiple"],
                    ["refRadioButtons", "refCheckboxes"],
                    // Object renderers
                    ["objectSingle"],
                    ["objectSingleOpen"],
                    ["objectSingleNoContainer"],
                    ["objectSingleItemTitle"],
                    ["objectMultiple"],
                    ["objectMultipleNoContainer"],
                    ["objectMultipleItemTitle"],
                    ["objectPassthrough"],
                    // Dynamic zone renderers
                    ["dynamicZoneSingle"],
                    ["dynamicZoneList"],
                    // Hidden
                    ["hiddenMeta"]
                ])
                .titleFieldId("textSingle")
                .singularApiName("RendererShowcase")
                .pluralApiName("RendererShowcases")
        ];
    }
}

export const RendererShowcaseModel = ModelFactory.createImplementation({
    implementation: RendererShowcaseModelImpl,
    dependencies: []
});
