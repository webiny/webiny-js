# File references & File Manager storage — validation

Investigation only. No code was modified.

**Repo state:** branch `claude/theme-app`, working tree as found.

---

## Terminology correction (affects the whole brief)

The brief refers to **Page Builder**. There is no Page Builder in this codebase. In v6 it is
**Website Builder**, and it is a different architecture, not a rename:

| Brief says   | Actually is     | Packages                                                                                                               |
| ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Page Builder | Website Builder | `api-website-builder`, `app-website-builder`, `website-builder-sdk`, `website-builder-react`, `website-builder-nextjs` |

Website Builder stores only _which component and what input values_; the React components
themselves live in the customer's Next.js app and are loaded into the editor in an iframe. There
is no Webiny-owned element/renderer registry holding image markup. This changes where a
reference extractor can hook in (relevant to Task 5).

Verified: package listing + `mcp__webiny__get_webiny_skill('webiny-website-builder')`.

---

## Summary — the four core assumptions

| Assumption                                                           | Holds                                                 | Confidence | Note                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ----------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image references persist both file ID and URL                        | **Partly — 4 of 8 write paths store no ID at all**    | High       | Website Builder `file` inputs and the CMS `asset` field store `{id, src, url, …}`. But the CMS `file` field, WB background images, the `fileUrl` field and custom icons store a **bare URL string with no ID**. Mitigating: the ID is embedded in the URL path (`{srcPrefix}{id}/{filename}`), so it is recoverable by parsing — see §1.4.                                       |
| File Manager records are CMS entries with revision support available | Not yet assessed                                      | —          | Task 2 — partially pre-confirmed: the file record **is** a private CMS model (`packages/api-file-manager/src/domain/file/file.model.ts:10`). Revision behaviour not yet checked.                                                                                                                                                                                                 |
| Delivery URLs are stable per file ID                                 | **Yes for routing — no for caching**                  | High       | The delivery layer resolves `id → KV metadata → bucketKey` and **never reads the filename** from the request path, so `/files/{id}/anything.jpg` already works. The blocker is not routing but the origin's hard-coded `Cache-Control: public, max-age=31536000` (1 year), which no CloudFront invalidation can reach. See §3.2, §3.4, §3.6.                                     |
| Transformation cache invalidates on original change                  | **S3 derivatives: yes, structurally. CloudFront: no** | High       | Derivative keys are derived from the source key (which contains the filename) plus a framing hash, so writing a new binary to a new key under the same `{id}/` prefix automatically yields clean new derivatives — stale ones are orphaned, never served. CloudFront does _not_ self-invalidate and currently fires only on delete or an `accessControl` change. See §4.1, §4.2. |

**Nothing found in Task 1 invalidates the shape of the work**, but two findings materially
change its cost, and both are called out in §1.5.

---

## Task 1 — How image references are persisted

### 1.1 Website Builder

#### Where page content actually lives

A page is a **private CMS entry**, model `wbyWbPage`:

`packages/api-website-builder/src/domain/page/page.model.ts:3`

```ts
export const PAGE_MODEL_ID = process.env.WEBINY_API_LEGACY_MODELS ? "wbPage" : "wbyWbPage";
…
model.fields(fields => ({
    properties: fields.searchableJson().label("Properties"),
    metadata: fields.searchableJson().label("Metadata"),
    bindings: fields.json().label("Bindings"),
    elements: fields.json().label("Elements"),
    extensions: fields.searchableJson().label("Extensions")
}));
```

Two storage consequences, both verified from the write path:

- `bindings` and `elements` are `json` → **gzip-compressed in storage**.
  `packages/api-headless-cms/src/features/storage/fields/JsonStorageTransform.ts:27` calls
  `compressorHandler.compress(value)`, which produces
  `{ compression: "gzip", value: "<base64>" }`
  (`packages/utils/src/features/compression/legacy/plugins/GzipCompression.ts:32`).
- `properties`, `metadata`, `extensions` are `searchable-json`. There is **no** storage transform
  registered for `searchable-json`, so it falls through to the `*` default
  (`packages/api-headless-cms/src/utils/entryStorage.ts:41` →
  `features/storage/fields/DefaultStorageTransform.ts`), i.e. **stored verbatim, uncompressed**.

_Confidence: High. Read from the model definition + the transform implementations + the resolution
function that picks a transform._

#### The element itself carries no input values

`packages/website-builder-sdk/src/types.ts:295`

```ts
export type DocumentElement = {
  type: "Webiny/Element";
  id: string;
  component: ElementComponent;
  parent?: { id: string; slot: string };
  styles?: ResponsiveStyles;
};
```

Input values live in a **separate** `bindings` map keyed by element id
(`packages/website-builder-sdk/src/types.ts:63`):

```ts
export type DocumentElementInputBindings = { [inputName: string]: InputValueBinding };
export type DocumentElementBindings = {
    $repeat?: RepeatValueBinding;
    inputs?: DocumentElementInputBindings;
    styles?: DocumentElementStyleBindings;
    metadata?: Record<string, any>;
    overrides?: { [key: string]: { inputs?: …; styles?: … } };
};
export type DocumentBindings = { [elementId: string]: DocumentElementBindings };
```

and each binding is an envelope (`types.ts:17`, `types.ts:45`):

```ts
export type InputValueBinding<T = any> = ValueBinding<T> & {
  id: string;
  type: string;
  translatable?: boolean;
  list?: boolean;
};
export type ValueBinding<T = any> = { static?: T; expression?: string; token?: TokenReference };
```

So an extractor must walk `bindings[*].inputs[*].static` **and**
`bindings[*].overrides[breakpoint].inputs[*].static` — per-breakpoint overrides are a second
copy of the value.

#### Image element — exact persisted JSON

Manifest (`packages/website-builder-react/src/editorComponents/Image.manifest.ts:14`) declares
`image: createFileInput({ … })`, whose renderer is `Webiny/FileManager`
(`packages/website-builder-sdk/src/createInput.ts:141`).

Write path — `packages/app-website-builder/src/inputRenderers/FileInput.tsx:70`:

```tsx
const onFileChange = (file: FileManagerFileItem) => {
  onChange(({ value }) => {
    value.set(fileManagerItemToValue(file));
  });
};
```

`packages/app-website-builder/src/shared/fileManagerItemToValue.ts:10`:

```ts
export const fileManagerItemToValue = (file: FileManagerFileItem): Asset => {
  const src = file.src || "";
  const asset: Asset = {
    id: file.id,
    src,
    url: src,
    name: file.name,
    type: file.type,
    size: file.size
  };
  if (getAssetCategory(file.type) === "image") {
    const meta = file.metadata?.image;
    asset.image = {
      width: meta?.width ?? file.width,
      height: meta?.height ?? file.height,
      crop: meta?.crop ?? undefined,
      focalPoint: meta?.focalPoint ?? undefined,
      alt: meta?.alt ?? undefined,
      caption: meta?.caption ?? undefined
    };
  }
  return asset;
};
```

Resulting persisted JSON, inside `bindings`:

```json
"bindings": {
  "elm_abc123": {
    "inputs": {
      "image": {
        "id": "<binding id>",
        "type": "file",
        "static": {
          "id": "6712a4…",
          "src": "https://d1xyz.cloudfront.net/files/6712a4…/photo.jpg",
          "url": "https://d1xyz.cloudfront.net/files/6712a4…/photo.jpg?crop=0.1,0,0,0",
          "name": "photo.jpg",
          "type": "image/jpeg",
          "size": 184320,
          "image": {
            "width": 1600, "height": 900,
            "crop": { "top": 0.1, "left": 0, "bottom": 0, "right": 0 },
            "focalPoint": { "x": 0.5, "y": 0.4 },
            "alt": "…", "caption": "…"
          }
        }
      },
      "title":   { "id": "…", "type": "text", "static": "photo.jpg" },
      "altText": { "id": "…", "type": "text", "static": "photo.jpg" }
    }
  }
}
```

The canonical type is `Asset` from `@webiny/sdk` (`packages/sdk/src/asset.ts:31`).

> **The TypeScript type is wrong here — exactly the failure mode the brief warned about.**
> `packages/website-builder-sdk/src/types.ts:545` declares
> `export type FileInput = BaseInput<string> & { type: "file"; allowedFileTypes: string[] };`
> — a `string`. The actual persisted value is the `Asset` **object**. Do not derive the reference
> extractor from the input type union.

_Confidence: High. Read from the write path (`value.set(...)`), not the type._

`url` is re-derived from `src` + `image.crop` whenever the per-usage crop is edited
(`FileInput.tsx:102-108`), so `url` is a denormalised convenience copy of `src`, not an
independent value.

#### Render path: URL only, never the ID

`packages/website-builder-react/src/editorComponents/Image.tsx:83`, `:117`, `:140`:

```tsx
const src = image?.src;
…
const getSrcSet = (src: string, srcSetWidths: number[]) =>
    srcSetWidths.map(item => `${src}?width=${item} ${item}w`).join(", ");
…
return { …, src: inputs.image?.src, srcSet, … };
```

`inputs.image.id` is **never read** at render. The ID is carried for the editor's benefit only.

_Confidence: High. Read from the render component._

#### Background image — a different shape

Background images are **not** a file input. They are a CSS style binding plus a metadata sidecar.

`packages/app-website-builder/src/BaseEditor/defaultConfig/Sidebar/StyleSettings/Groups/Background/BackgroundImage.tsx:53`:

```tsx
const onFileChange = (file: FileManagerFileItem) => {
  onChange(({ styles, metadata }) => {
    styles.set("backgroundPosition", DEFAULT_POSITION);
    styles.set("backgroundSize", DEFAULT_SCALING.backgroundSize);
    styles.set("backgroundRepeat", DEFAULT_SCALING.backgroundRepeat);
    styles.set("backgroundImage", `url("${file.src}")`);

    metadata.set("backgroundImage", {
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: file.src || ""
    });
  });
};
```

Persisted as:

```json
"bindings": {
  "elm_abc123": {
    "styles":   { "backgroundImage": { "static": "url(\"https://cdn/…/6712a4…/hero.jpg\")" } },
    "metadata": { "backgroundImage": { "id": "6712a4…", "name": "hero.jpg", "size": 421000,
                                       "type": "image/jpeg", "url": "https://cdn/…/6712a4…/hero.jpg" } }
  }
}
```

Notes:

- The style value is a **CSS string**, so an extractor must parse `url("…")` out of it (there is
  already a parser: `…/Background/BackgroundImageParser.ts`).
- The ID exists only in `metadata`, which is editor-sidebar state. On removal at a non-base
  breakpoint the code sets `backgroundImage: "none"` but still unsets metadata
  (`BackgroundImage.tsx:70-82`) — so **style and metadata can drift out of sync**. Treat
  `metadata.backgroundImage.id` as a hint, not as truth.
- Style bindings also exist per breakpoint under `overrides`.

_Confidence: High (write path). The drift observation is Medium — inferred from reading the
remove/reset branches, not observed in stored data._

#### Other Website Builder element types that can hold a file

| What                                                                  | Persisted shape                                           | ID?              | URL?                |
| --------------------------------------------------------------------- | --------------------------------------------------------- | ---------------- | ------------------- |
| Any component input built with `createFileInput` (incl. `list: true`) | `Asset` object, or `Asset[]`                              | Yes              | Yes (`src` + `url`) |
| `createObjectInput` with nested file inputs                           | `Asset` nested at arbitrary depth inside the object value | Yes              | Yes                 |
| `createLexicalInput`                                                  | `{ state: string; html: string }` — see below             | Yes (in `state`) | Yes (in both)       |
| Element background image                                              | CSS string + metadata sidecar (above)                     | metadata only    | Yes                 |
| Page settings `properties.image`, `properties.social.image`           | `{ id, name, size, mimeType, src, width, height }`        | Yes              | Yes                 |

There is **no** built-in file/document block element. The built-in component set is
`Box, Fragment, Grid, GridColumn, Image, Lexical, Root`
(`packages/website-builder-react/src/editorComponents/`). A customer component that accepts a PDF
uses the same `createFileInput` and therefore the same `Asset` shape — `allowedFileTypes` is the
only difference.

**Lexical inside Website Builder.** `packages/app-admin/src/components/LexicalEditor/lexicalValueWithHtml.ts:6`:

```ts
export type RichTextValueWithHtml = { state: string; html: string };
```

Both halves are persisted. `state` is the Lexical JSON containing `wby-image` nodes (see §1.2);
`html` is pre-rendered markup containing a plain `<img src="…">` with **no id attribute in the
serialized HTML path** the renderer uses. So a Website Builder rich-text field stores the same
image URL twice, once ID-tagged and once not.

**A/B test variants duplicate everything.** `packages/api-website-builder/src/domain/variant/variant.model.ts:18`:

```ts
// Full content snapshot — mirrors the page content fields. A variant is never a revision.
properties: fields.searchableJson(), metadata: fields.searchableJson(),
bindings: fields.json(), elements: fields.json(), extensions: fields.searchableJson()
```

Every file reference in a page can also exist in N variant entries of model `wbyWbVariant`. The
reference index must cover this model, not just `wbyWbPage`.

_Confidence: High._

---

### 1.2 Headless CMS

**There are two file-ish field types, and they disagree.**

#### `file` — deprecated, stores a bare URL string, no ID

`packages/app-file-manager/src/modules/HeadlessCms/fieldType/FileFieldType.tsx:17`

```tsx
deprecated = true;
```

`packages/app-headless-cms/src/admin/components/ContentModelEditor/FieldsSidebar.tsx:77`

```tsx
// Deprecated field types (e.g. "file", superseded by "asset") are only
// offered when the model already contains a field of that type, so
// existing models stay editable while new fields use the replacement.
```

Storage + GraphQL — `packages/api-headless-cms/src/features/graphql/fields/base/FileToGraphQL.ts:6`:

```ts
public createTypeField({ field }) {
    if (field.list) { return `${field.fieldId}: [String]`; }
    return `${field.fieldId}: String`;
}
```

Write path, single — `packages/app-file-manager/src/presentation/fieldRenderers/CmsFilePickerRenderer.tsx:37`:

```tsx
onSelectItem={() => showFileManager((file: FileManagerFileItem) => { field.onChange(file.src || ""); })}
```

Write path, multi — `.../CmsMultiFilePickerRenderer.tsx:31`:

```tsx
showFileManager((files: FileManagerFileItem[]) => {
    const newSrcs = files.map(f => f.src || "");
    …field.onChange([...currentValues, ...newSrcs]);
});
```

Stored value:

```json
{ "values": { "heroImage": "https://cdn/…/6712a4…/photo.jpg" } }
```

```json
{ "values": { "gallery": ["https://cdn/…/6712a4…/a.jpg", "https://cdn/…/88bb01…/b.jpg"] } }
```

**No ID. No name, size, dimensions, or crop.** This is the single biggest divergence from the
brief's assumption.

#### `asset` — current, stores the full object

`packages/api-headless-cms/src/features/graphql/fields/base/AssetToGraphQL.ts:83`:

```graphql
type FmAsset {
  id: String!
  src: String!
  url: String
  name: String!
  type: String!
  size: Number!
  image: FmAssetImage
  document: FmAssetDocument
  video: FmAssetVideo
}
```

Write path — `packages/app-file-manager/src/presentation/fieldRenderers/assetValue.ts:39`:

```ts
export const fileItemToAsset = (file: FileManagerFileItem): Asset => {
    const src = file.src;
    const asset: Asset = { id: file.id, src, url: src, name: file.name, type: file.type, size: file.size };
    if (typeof file.type === "string" && file.type.startsWith("image/")) { … asset.image = image;
        asset.url = buildAssetUrl(src, image.crop); }
    return asset;
};
```

Stored single value = the same `Asset` JSON as Website Builder (§1.1). List value = `Asset[]`,
type `[FmAsset]` (`AssetToGraphQL.ts:113-116`).

#### Storage layer vs GraphQL read API — they differ for `asset`

Yes, in one specific way: **`url` is stored, but the read API ignores the stored value and
recomputes it.**

`AssetToGraphQL.ts:119`:

```ts
public createResolver(): CmsModelFieldToGraphQL.Resolver {
    return { resolver: null, typeResolvers: { FmAsset: { url: (parent: any) => resolveAssetUrl(parent) } } };
}
```

`packages/api-headless-cms/src/features/modelBuilder/fields/resolveAssetUrl.ts:52` returns
`src` + `?crop=top,left,bottom,right` derived from `image.crop`.

And the input type knowingly accepts a value it will never honour
(`AssetToGraphQL.ts:98`):

```graphql
input FmAssetInput {
    id: String!  src: String!
    # TODO: figure out how to remove this from here, as this is a derived read-only value.
    url: String
    …
}
```

For every other field type there is no read-time reshaping: `file` and `asset` have **no**
storage transform registered, so both go through `DefaultStorageTransform` (`fieldType = "*"`,
pure passthrough — `packages/api-headless-cms/src/features/storage/fields/DefaultStorageTransform.ts:6`).

_Confidence: High for `url` being recomputed (read the resolver). High for passthrough storage
(read the transform table + the resolution function)._

#### Files inside rich text — different again, and compressed

`rich-text` field values **are gzip-compressed at rest**:
`packages/api-headless-cms/src/features/storage/fields/RichTextStorageTransform.ts:29`

```ts
public async toStorage({ value }) { return await this.compressionHandler.compress(value); }
```

producing `{ compression: "gzip", value: "<base64>" }`
(`packages/utils/src/features/compression/legacy/plugins/GzipCompression.ts:32`).

Inside the decompressed Lexical JSON, an image is a `wby-image` node carrying **both** id and
src — `packages/lexical-nodes/src/ImageNode.tsx:120`:

```ts
override exportJSON(): SerializedImageNode {
    return { id: this.__id, src: this.getSrc(), altText: this.getAltText(),
             width: …, height: …, maxWidth: this.__maxWidth, type: this.getType(), version: 1 };
}
```

Verified at the insertion point — `packages/lexical-editor/src/utils/files.ts:14`:

```ts
export const fileToImagePayload = (file: FileManagerFileItem): ImagePayload | null => {
    const imagePayload = {} as ImagePayload;
    imagePayload["id"] = file.id;
    imagePayload["src"] = file.src;
    imagePayload["altText"] = file.name;
    …
};
```

Third shape:

```json
{
  "type": "wby-image",
  "version": 1,
  "id": "6712a4…",
  "src": "https://cdn/…/6712a4…/photo.jpg",
  "altText": "photo.jpg",
  "width": 1600,
  "height": 900,
  "maxWidth": 800
}
```

_Confidence: High._

#### `object` / `dynamicZone` containing file fields

Yes, they can, and the value shape is unchanged — but the **storage path** does change:
`ObjectStorageTransform` re-dispatches per nested field
(`packages/api-headless-cms/src/features/storage/fields/ObjectStorageTransform.ts:19`):

```ts
const processValue = async ({ fields, sourceValue, getStorageTransform, model, operation }) =>
  await pReduce(
    fields,
    async (values, field) => {
      const storageTransform = getStorageTransform(getBaseFieldType(field));
      const value = await storageTransform[operation]({
        model,
        field,
        value: sourceValue[field.fieldId],
        getStorageTransform
      });
      return { ...values, [field.fieldId]: value };
    },
    {}
  );
```

It handles `field.list` by mapping over array entries (`:55-65`).
`DynamicZoneStorageTransform` is the equivalent for dynamic zones.

Practical consequence for the reference index: **you cannot extract by scanning the raw stored
entry JSON.** A `rich-text` field nested three levels deep inside an `object` is an independently
gzipped blob at that position. Extraction has to walk the model's field tree in step with the
value tree, decompressing per field — or run after `entryFromStorageTransform`, on the decoded
entry.

_Confidence: High._

---

### 1.3 Everywhere else

| Location                                                     | Package                                                | Storage shape                                                                                                                                                                                    | ID?                         | URL?             |
| ------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ---------------- |
| WB component `file` input (incl. lists, nested in `object`)  | `app-website-builder`, `website-builder-sdk`           | `Asset` object in `bindings[el].inputs[name].static` (gzipped `json` field)                                                                                                                      | ✅                          | ✅ `src` + `url` |
| WB element background image                                  | `app-website-builder`                                  | CSS `url("<src>")` in `bindings[el].styles.backgroundImage.static` + `bindings[el].metadata.backgroundImage = {id,name,size,type,url}`                                                           | ⚠️ metadata only, can drift | ✅               |
| WB Lexical input                                             | `app-website-builder`, `lexical-nodes`                 | `{ state, html }`; `state` holds `wby-image` `{id, src, …}`; `html` holds `<img src>`                                                                                                            | ✅ in `state`               | ✅ in both       |
| WB page settings — general image                             | `app-website-builder` (`GeneralSettingsGroup.ts:49`)   | `properties.image = {id,name,size,mimeType,src,width,height}` (uncompressed `searchable-json`)                                                                                                   | ✅                          | ✅               |
| WB page settings — social/OG image                           | `app-website-builder` (`SocialSettingsGroup.ts:58`)    | `properties.social.image` — same shape                                                                                                                                                           | ✅                          | ✅               |
| WB A/B variant snapshot                                      | `api-website-builder` (`variant.model.ts`)             | full copy of all of the above, model `wbyWbVariant`                                                                                                                                              | mirrors source              | mirrors source   |
| CMS `asset` field (single)                                   | `api-headless-cms`, `app-file-manager`                 | `Asset` object; `url` recomputed on read                                                                                                                                                         | ✅                          | ✅               |
| CMS `asset` field (list)                                     | same                                                   | `Asset[]`                                                                                                                                                                                        | ✅                          | ✅               |
| CMS `file` field (single) — **deprecated**                   | same                                                   | **bare URL `String`**                                                                                                                                                                            | ❌                          | ✅               |
| CMS `file` field (list) — **deprecated**                     | same                                                   | **`String[]` of URLs**                                                                                                                                                                           | ❌                          | ✅               |
| CMS `rich-text` field                                        | `api-headless-cms`, `lexical-nodes`                    | gzipped `{compression,value}`; inside, `wby-image` `{id, src}`                                                                                                                                   | ✅                          | ✅               |
| Generic admin FormModel `file()` field                       | `app-admin` (`FilePickerRenderer.tsx:52`)              | `{id, name, size, mimeType, src, width, height}`                                                                                                                                                 | ✅                          | ✅               |
| Generic admin FormModel `file().list()`                      | `app-admin` (`MultiFilePickerRenderer.tsx:31`)         | array of the above                                                                                                                                                                               | ✅                          | ✅               |
| Generic admin FormModel `fileUrl()` field                    | `app-admin` (`FileUrlPickerRenderer.tsx:26`)           | bare URL string                                                                                                                                                                                  | ❌                          | ✅               |
| Icon picker — custom SVG icon                                | `app-admin` (`IconPicker/plugins/customPlugin.tsx:65`) | `{ type: "custom", name, value: <src> }`                                                                                                                                                         | ❌                          | ✅               |
| User avatar                                                  | `cognito` → `app-admin/SingleImageUpload.tsx:106`      | `{ id, src }` (default; `includeFileMeta` opts into the full item)                                                                                                                               | ✅                          | ✅               |
| Website Builder site settings                                | `app-website-builder`                                  | `{ previewDomain: string }` — **no logo / favicon / default social image**                                                                                                                       | —                           | —                |
| Tenant settings `logo` / `favicon`                           | `api-core` (`RequestTenantLoader.ts:28`)               | keys present in the bootstrap root tenant; `TenantSettings = Record<string, any>`; **no writer, no admin UI, no GraphQL field found**                                                            | —                           | —                |
| Theme assets                                                 | `api-theme`, `app-theme`                               | design tokens only; **no file references**                                                                                                                                                       | —                           | —                |
| Form Builder field definitions                               | —                                                      | **Form Builder does not exist in v6** (no `api-form-builder` / `app-form-builder` package)                                                                                                       | —                           | —                |
| File Manager record → other file (thumbnail/preview pointer) | `api-file-manager`                                     | **none.** `file.model.ts` has `name, key, type, size, metadata{image,exif,iptc}, tags, description[, accessControl]`. Previews are computed as `srcPrefix + key` (`FileDetailsPresenter.ts:154`) | —                           | —                |
| Remote components (AI-generated)                             | `remote-components`                                    | source/CSS/JS text only; **no file references**                                                                                                                                                  | —                           | —                |

_Confidence: High for every row read from a write path. Medium for the tenant `logo`/`favicon`
row — I verified there is no writer in `packages/`, but a customer project or an unindexed
extension could still write those keys, since the type is `Record<string, any>`._

---

### 1.4 The finding that changes the cost of the whole reference index

**The file ID is embedded in the storage key, and therefore in every stored URL.**

`packages/app-file-manager/src/presentation/hooks/useCmsImageEditor.ts:16`:

```ts
/**
 * Resolve a File's id from its public URL. File keys are `{id}/{filename}` and the
 * URL is `{srcPrefix}{key}`, so the id is the second-to-last path segment (this is
 * the same convention the asset-delivery ObjectKey relies on).
 */
const parseFileId = (url: string): string | undefined => {
  const clean = url.split("?")[0].replace(/\/+$/, "");
  const parts = clean.split("/").filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : undefined;
};
```

Corroborated by `packages/app-file-manager/src/presentation/FileDetails/FileDetailsPresenter.ts:154`:

```ts
const srcPrefix = this.settingsRepository.settings?.srcPrefix ?? "";
return `${srcPrefix}${this.file.key}`;
```

This means the four ID-less reference shapes (CMS `file` field, WB background image CSS,
`fileUrl` field, custom icons) are still **ID-recoverable by parsing the URL**. The reference
index does not need a migration to become useful.

It also means the delivery URL is **not** a pure function of the file ID — it carries the
filename too. That is the thread to pull in Task 3.

_Confidence: High for the convention (stated in two places in application code and used to drive
a real API call). I have not yet read the upload path that mints the key — that is Task 3, and it
is what would move "keys are `{id}/{filename}`" from High to Verified-at-source._

---

### 1.5 Two findings that change the cost of the work

1. **Content is gzipped at rest in exactly the fields that hold references.**
   WB `bindings`/`elements` and CMS `rich-text` are gzip blobs in storage. A reference extractor
   cannot scan raw stored records; it must run on decoded values (post-`fromStorage`), and it
   must walk the model field tree because nested `rich-text` is compressed independently at its
   own position. This rules out a cheap "scan the table" backfill.

2. **The render path never uses the file ID — anywhere.**
   Website Builder's `ImageComponent` reads `inputs.image.src`; background images render a CSS
   `url()`; the CMS `file` field has no ID to read; Lexical's rendered `html` half carries only
   `src`. The stored ID is editor bookkeeping. Version-based replacement therefore **cannot** work
   by "updating every consumer through the ID" unless the delivery URL itself is made stable —
   which is precisely the Task 3 question. If it is not stable, the alternative is rewriting the
   stored `src`/`url` in every content location, which is exactly the reference index's job. The
   two features are more coupled than the brief assumes.

---

## Open questions from Task 1

- Whether any customer project or unindexed extension writes tenant `settings.logo` /
  `settings.favicon`. Resolvable by grepping a real project's `extensions/` directory, or by
  dumping a tenant record from a deployed environment.
- Whether stored `Asset.url` values in existing content are ever stale relative to `image.crop`
  (for `asset` fields the read API masks it; for Website Builder there is no such resolver, so a
  stale `url` would be served). Resolvable by inspecting real page documents.
- Whether `bindings[el].metadata.backgroundImage` drifts from the style value in practice.
  Resolvable the same way.

---

## Task 2 — File Manager storage model

_Not started — awaiting confirmation of Task 1, per the brief's checkpoint._

## Task 3 — Storage keys and delivery

### 3.1 The upload path that mints the key — confirmed at source

`packages/api-file-manager/src/features/upload/utils/FileNormalizer.ts:39`

```ts
async normalizeFile(payload: PresignedPostPayloadData): Promise<FileData> {
    const data = { ...payload, id: payload.id || mdbid(), type: payload.type || resolveTypeFromName(payload.name) };
    const key = new FileKey(data);
    const defaultKey = key.toString();
    …
    return { id: data.id, key: key.toString(), name: file.name, size: file.size, type: file.type };
}
```

`packages/api-file-manager/src/features/upload/utils/FileKey.ts:25` (identical copy at
`packages/api-file-manager-s3/src/utils/FileKey.ts:25`)

```ts
toString() {
    return [this.data.keyPrefix, this.data.id, this.key].filter(Boolean).join("/");
}
private getSanitizedKey() {
    const key = sanitizeFilename(this.data.key || this.data.name).replace(/\s/g, "");
    return [key, this.getExtension()].filter(Boolean).join(".");
}
```

Corroborated by the unit tests — `packages/api-file-manager-s3/src/utils/FileKey.test.ts:25`, `:47`:

```ts
expect(fileKey.toString()).toEqual("12345678/image-14.jpeg");
expect(fileKey.toString()).toEqual("prefix/12345678/image-14.jpeg");
```

So the **stored** `file.key` is `[keyPrefix/]{id}/{sanitized-filename}.{ext}`. The `{id}/{filename}`
convention asserted in Task 1 is **confirmed at source**, with the caveat that an optional
`keyPrefix` may precede the id.

The **full S3 object key** adds a tenant prefix at presign time and is _not_ stored on the record —
`packages/api-file-manager-s3/src/utils/getPresignedPostPayload.ts:33`:

```ts
const storageKey = `tenants/${tenant.id}/files/${file.key}`;
```

The same derivation is repeated in `MetadataWriter.getMetadata` (`MetadataWriter.ts:30`).

**Same file ID uploaded twice with different filenames.** The upload input accepts a
client-supplied `id` — `packages/api-file-manager-s3/src/graphql/S3GraphQLSchema.ts:25`:

```graphql
input PreSignedPostPayloadInput {
  id: ID
  name: String!
  type: String!
  size: Long!
  key: String
  keyPrefix: String
}
```

and it is passed straight through (`S3GraphQLSchema.ts:124`: `await normalizer.normalizeFile(args.data)`),
where `id: payload.id || mdbid()` accepts it verbatim. There is **no uniqueness check, no collision
check, and no verification that the ID exists or belongs to the caller** beyond the `rwd: "w"`
permission check.

| Scenario                        | Result                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Same id, **different** filename | **Different key.** A second object appears under `tenants/{t}/files/{id}/`. The old object is _not_ removed. Both coexist indefinitely. |
| Same id, **same** filename      | **Same key.** S3 overwrites in place — and with versioning off (§3.5) the previous bytes are gone.                                      |
| Which one is actually served    | Decided by the KV metadata `bucketKey` (§3.2), **not** by S3 and not by the URL.                                                        |

Minor quirk, noted not fixed — `FileNormalizer.ts:60`: if a `FileUploadModifier` rewrites the key,
`key.setKey(file.key)` feeds it back through `toString()`, which re-prefixes with `keyPrefix/id`. A
modifier therefore cannot move a file out of its `{id}/` folder.

_Confidence: High. Read from the write path plus its unit tests._

---

### 3.2 Can delivery resolve on file ID alone, with no filename segment?

**Yes — that is already exactly what it does. The filename segment is never read.**

The chain, in order:

1. **Route** — `packages/api-file-manager/src/delivery/AssetDeliveryRoute.ts:18`

   ```ts
   readonly method = "GET";
   readonly path = "/files/*";
   ```

   Gateway mapping — `packages/project-aws/src/pulumi/apps/api/createApiPulumiApp.ts:220`:
   `"files-any": { path: "/files/{path+}", method: "ANY", function: fileManager.functions.download… }`

2. **Request resolution — pure string manipulation.**
   `packages/api-file-manager/src/features/assetDelivery/FilesAssetRequestResolver.ts:7`

   ```ts
   const path = params["*"];
   const options: AssetRequestOptions = { ...query, original: "original" in query };
   if (query.width) {
     options.width = parseInt(query.width);
   }
   return new AssetRequest({
     key: decodeURI(path).replace("/files/", ""),
     context: { url: request.url ?? "" },
     options
   });
   ```

3. **Asset resolution — ID extraction, then a metadata lookup.**
   `packages/api-file-manager-s3/src/assetDelivery/s3/S3AssetResolver.ts:25`

   ```ts
   const fileId = ObjectKey.from(request.getKey()).id();
   const result = await this.keyValueStore.get<AssetMetadata>(
     `FileManager/File/${fileId}/Metadata`
   );
   if (result.isFail()) {
     return undefined;
   }
   const metadata = result.value;
   const asset = new Asset({
     id: metadata.id,
     tenant: metadata.tenant,
     size: metadata.size,
     contentType: metadata.contentType,
     key: metadata.bucketKey
   });
   ```

4. **ID extraction takes the first path segment and discards the rest.**
   `packages/api-file-manager-s3/src/assetDelivery/threatDetection/ObjectKey.ts:12`
   ```ts
   id() { const [id] = this.relativeKey().split("/"); return id; }
   relativeKey() { return this.bucketKey.replace(/^tenants\/[^/]+\/files\//, ""); }
   ```

The S3 key actually fetched is `metadata.bucketKey` — a value from the KV store, never the request
path. Consequently `/files/{id}/photo.jpg`, `/files/{id}/anything-else.png`, and `/files/{id}` all
resolve to the same object.

Format detection also uses the **resolved** key, not the request path —
`packages/api-file-manager/src/delivery/AssetDelivery/Asset.ts:48`:

```ts
getExtension() { return this.getKey().split(".").pop() ?? ""; }
```

consumed by `ImageAssetType.canHandle` (`ImageAssetType.ts:7`) and `SharpTransform` (`:246`).
`AssetRequest.getExtension()` exists (`AssetRequest.ts:44`) but is **not called anywhere in the
delivery path** — so a filename-less URL does not break format handling.

**Query transformation parameter parsing** —
`packages/api-file-manager/src/features/assetDelivery/assetTypes/image/normalizeImageOptions.ts:8`:

| Param         | Parsing                                                                                                        | Rejected when                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `width`       | `parseInt(…, 10)`                                                                                              | NaN or `<= 0`                                                                    |
| `quality`     | `clampQuality(parseInt(…))`                                                                                    | absent                                                                           |
| `format`      | `resolveRequestedFormat(query.format, acceptHeader)` — so `format=auto` negotiates against the `Accept` header | unresolvable                                                                     |
| `crop`        | four floats `top,left,bottom,right`, clamped 0..1                                                              | not 4 parts, any NaN, all-zero (no-op), or `top+bottom >= 1` / `left+right >= 1` |
| `aspectRatio` | `"w:h"` → `w/h`, else `parseFloat`                                                                             | non-positive                                                                     |
| `focal`       | two floats `x,y`, clamped 0..1                                                                                 | not 2 parts or any NaN                                                           |
| `original`    | presence flag — `"original" in query`                                                                          | —                                                                                |

`original` short-circuits all transformation —
`packages/api-file-manager/src/features/assetDelivery/transformation/TransformationAssetProcessor.ts:11`:

```ts
const { original } = assetRequest.getOptions();
if (original) {
  console.log("Skip transformations; original asset was requested.");
  return asset;
}
```

**Private variant.** `PrivateFileAssetRequestResolver` decorates the resolver and handles
`/private/*` identically, setting `context.private = true`
(`packages/api-file-manager/src/features/assetDelivery/privateFiles/PrivateFileAssetRequestResolver.ts:12`).
Downstream resolution is the same ID-only path.

**Conclusion.** A stable, filename-independent delivery URL is not merely possible — it is what the
resolver already implements. No routing change is needed to serve `/files/{id}`. What is missing is
(a) anything that _emits_ such a URL (every writer emits `srcPrefix + key`, per Task 1), and (b) the
cache behaviour in §3.4.

_Confidence: High. Read end-to-end through the resolver chain._

---

### 3.3 Does the delivery path already look up the file record?

**Yes — two lookups. Resolution is not pure string manipulation.**

**1. A KV metadata read on every asset request.** `S3AssetResolver` (above) reads
`FileManager/File/{id}/Metadata` from `GlobalKeyValueStore`. This is not the CMS entry; it is a
separate projection written by
`packages/api-file-manager/src/features/upload/WriteFileMetadata/MetadataWriter.ts:17`:

```ts
public async write(files: MetadataWriterAbstraction.File[]) {
    const writers = files.map(async file => {
        const metadata = this.getMetadata(file);
        await this.keyValueStore.set(`FileManager/File/${file.id}/Metadata`, metadata);
    });
    await Promise.all(writers);
}
private getMetadata(file) {
    const tenant = this.tenantContext.getTenant();
    return { id: file.id, bucketKey: `tenants/${tenant.id}/files/${file.key}`,
             tenant: tenant.id, size: file.size, contentType: file.type };
}
```

Written from three handlers in the same folder — `WriteMetadataAfterCreateHandler`,
`WriteMetadataAfterUpdateHandler`, `WriteMetadataAfterBatchCreateHandler`. The update handler is
unconditional and its comment states the intent plainly
(`WriteMetadataAfterUpdateHandler.ts:13`):

```ts
// Re-write the delivery metadata so changes (e.g. the image crop) propagate
// to the asset-delivery pipeline.
```

**This indirection is what makes ID-stable URLs work**, and it is already maintained on every file
update.

**2. A full CMS entry read on every image transformation.**
`packages/api-file-manager-s3/src/assetDelivery/s3/SharpTransform.ts:94`:

```ts
private async loadAssetCrop(fileId: string) {
    const result = await this.identityContext.withoutAuthorization(() => this.getFile.execute(fileId));
    if (result.isFail()) { return undefined; }
    const imageEdit = result.value.metadata?.imageEdit as AssetImageEdit | undefined;
    return imageEdit?.crop;
}
```

> **Bug found — noted, not fixed.** This reads `metadata.imageEdit`, but the file model defines the
> crop at `metadata.image.crop` (`packages/api-file-manager/src/domain/file/file.model.ts:28-40`).
> Grepping the repo, `imageEdit` is **read** in two places (`SharpTransform.ts:99` and
> `packages/api-file-manager-server/src/assetDelivery/LocalSharpTransform.ts:99`) and **written
> nowhere**. So the asset-level crop set in File Manager never reaches the delivery pipeline — only a
> per-usage `?crop=` query param has any effect. As a side effect, the per-request CMS entry read is
> currently pure overhead on every image request.

_Confidence: High for the two lookups. High for the `imageEdit` mismatch (negative grep across the
repo + the model definition). I did not run the code to observe the crop being dropped._

---

### 3.4 CloudFront behaviours, TTLs, and invalidation

One distribution: `packages/project-aws/src/pulumi/apps/api/ApiCloudfront.ts`. Every behaviour
targets the **API Gateway** origin (`ApiCloudfront.ts:133-148`) — **there is no S3 origin**, so every
asset byte is served through Lambda.

| Behaviour      | minTtl  | defaultTtl | maxTtl             | queryString | compress          |
| -------------- | ------- | ---------- | ------------------ | ----------- | ----------------- |
| default `*`    | 0       | 0          | 86400 (1 d)        | true        | true              |
| `/cms*`        | not set | not set    | not set            | true        | true              |
| `/wb/*`        | not set | not set    | not set            | true        | true              |
| **`/files/*`** | **0**   | **0**      | **2592000 (30 d)** | **true**    | **not set → off** |
| `/private/*`   | 0       | 0          | 2592000 (30 d)     | true        | not set → off     |

Forwarded headers, all behaviours (`ApiCloudfront.ts:19`):

```ts
const forwardHeaders = [
  "Origin",
  "Authorization",
  "Accept",
  "Accept-Language",
  "X-Tenant",
  "X-Webiny-Sdk"
];
```

This uses the legacy `forwardedValues` API, so forwarded headers **and** the whole query string are
part of the cache key. `Accept` in the key is required for `format=auto`; `Authorization` in the key
fragments the cache per token. `/files/*` and `/private/*` do not set `compress`.

`defaultTtl: 0` means CloudFront defers to the origin's `Cache-Control`. The origin sends:

| Reply                            | `cache-control`                                                     | Source                                                                                         |
| -------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Streamed asset (S3)              | `public, max-age=31536000` — **365 days**                           | `packages/api-file-manager-s3/src/assetDelivery/s3/S3StreamAssetReply.ts:10`                   |
| Streamed asset (core)            | `public, max-age=31536000`                                          | `packages/api-file-manager/src/features/assetDelivery/StreamAssetReply/StreamAssetReply.ts:10` |
| Redirect to public / private URL | `public, max-age=2592000` (30 d)                                    | `RedirectToPublicUrlOutputStrategy.ts:22`, `RedirectToPrivateUrlOutputStrategy.ts:22`          |
| Not authorized                   | `no-store`                                                          | `NotAuthorizedAssetReply.ts:9`                                                                 |
| Route-level 404                  | `no-cache, no-store, must-revalidate`                               | `AssetDeliveryRoute.ts:13`                                                                     |
| `PublicCache` / `PrivateCache`   | rewrite only the `public`/`private` directive, preserving `max-age` | `PublicCache.ts:17`, `PrivateCache.ts:17`                                                      |

**Net effect: the edge caches for up to 30 days (capped by `maxTtl`), and browsers cache for one
year.** `maxTtl` bounds only what CloudFront stores — the origin's `max-age=31536000` is passed
through to the client unchanged. This is the hard constraint on version replacement: an invalidation
clears the edge but cannot reach a browser holding a year-long entry.

**Invalidation from application code — yes, it exists today.**

`packages/api-file-manager-s3/src/features/FlushCache/InvalidateCacheTask.ts:93`:

```ts
const cloudfront = new CloudFront();
await cloudfront.createInvalidation({
  DistributionId: distributionId,
  InvalidationBatch: {
    CallerReference: `${new Date().getTime()}-${caller}`,
    Paths: { Quantity: paths.length, Items: paths }
  }
});
```

Distribution id comes from `ServiceDiscovery.load()` → `manifest.api.cloudfront.distributionId`
(`:47`). It retries on `TooManyInvalidationsInProgress` / `Throttling` (`:28`), has
`maxIterations = 100`, and self-cleans. IAM is granted at
`packages/project-aws/src/pulumi/apps/api/ApiGraphql.ts:250` (`cloudfront:CreateInvalidation`).

Paths are **ID-keyed wildcards** — `packages/api-file-manager-s3/src/utils/CdnPathsGenerator.ts:2`:

```ts
generate(fileId: string): string[] {
    return [`/files/${fileId}/*`, `/private/${fileId}/*`];
}
```

One invalidation therefore covers every filename **and** every transformation query variant under
that ID.

Current triggers:

| Handler                               | Event                          | Condition                                |
| ------------------------------------- | ------------------------------ | ---------------------------------------- |
| `FlushCacheOnFileDeleteHandler.ts:12` | `FileAfterDeleteEventHandler`  | unconditional                            |
| `FlushCacheOnFileUpdateHandler.ts:12` | `FileBeforeUpdateEventHandler` | **only if `accessControl.type` changed** |

`packages/api-file-manager-s3/src/features/FlushCache/FlushCacheOnFileUpdateHandler.ts:18`:

```ts
// Only trigger cache flush if access control type has changed
if (prevAccessControl?.type === newAccessControl?.type) {
  return;
}
```

A binary replacement, a crop change, or a `key` change fires **no invalidation today**.

**This is the invalidation path to reuse.** The generator is already ID-keyed and the task already
exists; only the update handler's guard needs widening.

_Confidence: High. Read from the Pulumi module, the reply classes, the task, and both handlers._

---

### 3.5 S3 object versioning

**Not enabled.** `packages/project-aws/src/pulumi/apps/core/CoreFileManager.ts` creates:
`aws.s3.Bucket` (`forceDestroy: !protect`), `BucketOwnershipControls`, `BucketAcl` (private),
`BucketCorsConfiguration`, `BucketPublicAccessBlock`, and one `BucketLifecycleConfiguration`.
There is **no `aws.s3.BucketVersioning` resource anywhere** under `packages/project-aws/src/pulumi`
(negative grep for `versioning|Versioning`).

The only lifecycle rule is scoped to the `theme-extraction/` prefix (7-day expiry, abort incomplete
multipart after 1 day — `CoreFileManager.ts:84-106`). **Nothing governs `tenants/*/files/*`.**

What enabling versioning would affect in the current code:

1. **Delete would stop deleting.** `packages/api-file-manager-s3/src/features/DeleteFileFromBucket/DeleteS3FolderTask.ts:49`
   ```ts
   const filesList = await s3.listObjectsV2({ Bucket: input.bucket, Prefix: `${input.folderKey}/`,
                                              ContinuationToken: input.continuationToken });
   …
   const objectsToDelete = filesList.Contents.filter(f => f.Key).map(f => ({ Key: f.Key! }));
   await s3.deleteObjects({ Bucket: input.bucket, Delete: { Objects: objectsToDelete } });
   ```
   No `VersionId` is passed, so under versioning this writes **delete markers** — the bytes stay and
   keep costing. Worse, `listObjectsV2` enumerates only current versions, so noncurrent versions
   would never be listed and never purged. A real purge needs `listObjectVersions` + versioned
   deletes, or a `NoncurrentVersionExpiration` lifecycle rule.
   (Triggered from `DeleteFileFromBucketHandler.ts:19`, which deletes the whole
   `tenants/{tenant}/files/{file.id}` folder and then drops the KV metadata key.)
2. **Bucket teardown.** `forceDestroy: !protect` must delete every version. Pulumi handles it, but
   destroy time and cost grow with retained versions.
3. **The read path would not change.** `S3ContentsReader` and `SharpTransform` call `getObject`
   without `VersionId`, so they keep reading the current version. Versioning alone would **not**
   give addressable historical binaries — you would still need to record a `VersionId` per file
   revision, and nothing writes or stores one today.
4. No other interaction found; `configureS3BucketMalwareProtection.ts` operates on the bucket as a
   whole.

_Confidence: High for the absent resource and the versionless delete calls. Medium for the
completeness of the "what would be affected" list — I traced the delete and read paths but did not
audit every S3 call across the monorepo._

---

### 3.6 Answer to the driving question

> If we write a new binary under a new key against the same file ID, does an existing stored URL in
> page content still resolve?

**Yes. Routing already handles it.** The sequence that works today:

1. Presign an upload with the **existing** `id` and a new filename → new object at
   `tenants/{t}/files/{id}/{newname}.ext` (§3.1).
2. `updateFile(id, { key: "{id}/{newname}.ext", … })`. `key` is a model field
   (`file.model.ts:20`) and appears on `FmFileUpdateInput`, which is generated from the model
   (`FmGraphQLSchema.ts:167` → `renderInputFields({ …, fields: createUpdateFields(fields) })`).
3. `WriteMetadataAfterUpdateHandler` fires `MetadataWriter.write([file])`, rewriting
   `FileManager/File/{id}/Metadata.bucketKey` to the new key (§3.3).
4. Any request to `/files/{id}/<any old filename>?<any params>` resolves via the **ID** and is
   served the **new** object (§3.2).

**What would need to change:**

- **Invalidation must fire on binary replacement.** Today `FlushCacheOnFileUpdateHandler` returns
  early unless `accessControl.type` changed (§3.4). Widen the guard — a `key` change is the obvious
  trigger. `CdnPathsGenerator` already produces the correct ID-keyed wildcards.
- **The one-year browser `max-age` must be addressed.** `S3StreamAssetReply.ts:10` hard-codes
  `public, max-age=31536000` with no revalidation directive, and a CloudFront invalidation does not
  reach browsers. Options: lower `max-age` and lean on the 30-day edge cache; add
  `must-revalidate` / `stale-while-revalidate`; or put a version discriminator in the emitted URL —
  which reintroduces the content-rewrite problem the feature exists to avoid.
- **Old binaries are never cleaned up.** Re-uploading under a different filename leaves the previous
  object in the `{id}/` folder indefinitely. Only file _deletion_ clears the folder (§3.5).
- **Nothing currently emits an ID-only URL.** Every writer stores `srcPrefix + key` (Task 1).
  Serving `/files/{id}` works today, but adopting that form for new content is a separate change;
  existing filename-form URLs keep resolving either way.
- **`GetFileByUrlUseCase` is the one filename-dependent resolver.**
  `packages/api-file-manager/src/features/file/GetFileByUrl/GetFileByUrlUseCase.ts:21`:
  ```ts
  const query = pathname.replace("/files/", "").replace("/private/", "");
  const filesResult = await this.listFiles.execute({ where: { key: query }, limit: 1 });
  ```
  It matches `key` **exactly**, so it breaks for a URL whose filename no longer matches the record.
  It would need the same ID-parsing convention used everywhere else.

---

### Open questions from Task 3

- Whether any deployed environment has bucket versioning enabled out-of-band (via console or a
  customer Pulumi override). Resolvable with `aws s3api get-bucket-versioning` against a real
  environment.
- Whether the KV store backing `GlobalKeyValueStore` is strongly consistent, which determines
  whether a `key` update is visible to the very next delivery request or can briefly serve the old
  object. Resolvable by reading the `GlobalKeyValueStore` implementation and its DynamoDB read
  settings — I did not trace it in this pass.
- The real-world hit rate of the 30-day edge cache vs. the 1-year browser cache, which decides
  whether lowering `max-age` is an acceptable trade. Needs CloudFront metrics, not code.

## Task 4 — Image transformations and derivatives (narrowed)

Context: replacement keeps the file ID, writes the new binary to a **new S3 key under the same
`{id}/` prefix**, updates `metadata.bucketKey`, rewrites no content; version history is a list of
previous keys on the file record; S3 object versioning stays off; origin `cache-control` will be
split into a short `max-age` and a long `s-maxage`.

### 4.1 Derivatives are persisted — to the same S3 bucket, inside the `{id}/` prefix

**Yes, well beyond the CloudFront cache.** The transform path is a read-through S3 cache with two
levels, both writing back with `putObject`.

`packages/api-file-manager-s3/src/assetDelivery/s3/SharpTransform.ts:103` — transformed level:

```ts
private async transformAsset(asset: Asset, options: TransformOptions, framing: Framing) {
    const assetKey = AssetKeyGenerator.create(asset, framing);
    const transformedAssetKey = assetKey.getTransformedImageKey(options);
    …
    try {
        const { Body } = await this.s3.getObject({ Bucket: this.bucket, Key: transformedAssetKey });
        …
        console.log(`Return a previously transformed asset`, { key: transformedAssetKey, … });
        return newAsset;
    } catch {
        …
        await this.s3.putObject({
            Bucket: this.bucket, Key: transformedAssetKey,
            ContentType: newAsset.getContentType(), Body: await newAsset.getContents()
        });
        return newAsset;
    }
}
```

`:169` — optimized level, same read-then-write-back shape against `getOptimizedImageKey()`.

**Key layout** — `packages/api-file-manager/src/features/assetDelivery/assetTypes/image/utils.ts:21`:

```ts
const getOptimizedImageKeyPrefix = (key, cropSignature) => {
  const { filename, dirname } = parseKey(key);
  return `${dirname}/optimized/${cropSegment(cropSignature)}${filename}`;
};
const getOptimizedTransformedImageKeyPrefix = (key, transformationsHash, cropSignature) => {
  const { filename, dirname } = parseKey(key);
  return `${dirname}/optimized/${cropSegment(cropSignature)}${transformationsHash}-${filename}`;
};
```

with `transformationsHash = objectHash(transformations)` (`:63`) and `cropSignature` a 16-char
`objectHash` of the framing (`getFramingSignature`, `:72`).

Since `key` here is `asset.getKey()` = `metadata.bucketKey`, derivatives land at:

```
tenants/{t}/files/{id}/optimized/[{framingHash}/]{filename}                    ← optimized
tenants/{t}/files/{id}/optimized/[{framingHash}/]{transformHash}-{filename}    ← transformed
```

Three consequences for the locked plan:

1. **A new key under the same `{id}/` produces clean new derivatives, automatically.** The
   derivative key embeds `{filename}`, so `newname.jpg` cannot collide with `oldname.jpg`'s
   derivatives. No stale derivative can be served for the new binary. **This is the answer to the
   original Task 4 question, and it holds without any code change.**
2. **Old derivatives are orphaned, never deleted.** Nothing prunes them on update. They accumulate
   in the `{id}/optimized/` folder and cost storage indefinitely. (Same already applies to a crop
   change: the comment at `utils.ts:14` states the intent — "changing a file's crop invalidates its
   derivatives" — but it invalidates by _namespacing_, not by deleting.) A version-history feature
   that keeps N previous keys will multiply this.
3. **File deletion does clean them up.** `DeleteS3FolderTask` deletes prefix
   `tenants/{tenant}/files/{file.id}/` (`DeleteFileFromBucketHandler.ts:24`), which contains
   `optimized/`. Verified by prefix arithmetic, not by running it.

**No other cache layer exists.** Negative greps across `api-file-manager`, `api-file-manager-s3`
and `api-file-manager-server`:

| Candidate                                  | Found?                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate rendition/derivative bucket       | **No** — `this.bucket` is the single `S3Bucket` binding, same bucket as originals                                                                                                                                                                           |
| S3 write from the transform path           | **Yes** — the two `putObject` calls above                                                                                                                                                                                                                   |
| KV cache of derivatives                    | **No** — `GlobalKeyValueStore` is used only for `FileManager/File/{id}/Metadata`                                                                                                                                                                            |
| Lambda-local `/tmp` caching                | **No** — zero matches for `tmpdir`, `/tmp`, `os.tmp` in all three packages                                                                                                                                                                                  |
| In-memory cache surviving a warm container | **Only the Sharp module handle.** `SharpTransform.getTransformer()` (`:57`) memoises `this.transformer`, a lazily-imported `SharpTransformer` instance — a code handle, **not image data**. No `Map`/object cache of buffers anywhere in the delivery path. |

Local development mirrors the same layout on disk rather than S3 —
`packages/api-file-manager-server/src/assetDelivery/LocalSharpTransform.ts:106`:
`path.join(this.storagePath, transformedAssetKey)`, with `fs.readFile` / `fs.writeFile` at `:113`
and `:147`. Same key derivation, so the same conclusions hold locally.

_Confidence: High. Read from the write path; cache-layer absences are negative greps across the
three FM packages._

---

### 4.2 What `/files/{id}/*` actually invalidates

Two separate questions; the answers differ.

**Query variants: covered.** The `/files/*` behaviour sets `forwardedValues.queryString: true`
(`ApiCloudfront.ts:106`), so every distinct query string is its own cached object. A CloudFront
invalidation path matches against the request path, and a **trailing `*` extends past the `?`** —
so `/files/{id}/*` covers `/files/{id}/photo.jpg`, `/files/{id}/photo.jpg?width=300`,
`?width=300&format=webp`, and so on. One invalidation clears every variant under that ID.

> This last point is AWS-documented invalidation-wildcard behaviour, **not verifiable from this
> repo**. Confidence: Medium. It would move to High by issuing an invalidation against a real
> distribution and confirming a query-string variant was purged.

**A filename-less path: NOT covered.** `packages/api-file-manager-s3/src/utils/CdnPathsGenerator.ts:2`

```ts
generate(fileId: string): string[] {
    return [`/files/${fileId}/*`, `/private/${fileId}/*`];
}
```

The pattern requires a literal `/` after the id, so it matches `/files/{id}/…` but **does not match
`/files/{id}`**. Task 3 §3.2 established that `/files/{id}` _does_ resolve and _is_ served — so such
a response would be cached at the edge and never invalidated.

This is latent today (nothing emits a filename-less URL yet — every writer emits
`srcPrefix + file.key`, §4.4) but becomes live the moment filename-less URLs are adopted. The fix is
one character: dropping the slash to `/files/${fileId}*` covers both forms.

_Confidence: High for the `/files/{id}` gap — pure pattern matching against a literal in the source._

---

### 4.3 Every place a `cache-control` header is set on an asset response

Exhaustive sweep of `api-file-manager`, `api-file-manager-s3`, `api-file-manager-server`, `handler`,
`event-handler-core`:

| #   | File:line                                                                                           | Value                                                                                              | When it applies                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `api-file-manager-s3/src/assetDelivery/s3/S3StreamAssetReply.ts:10`                                 | `public, max-age=31536000` (**365 d**)                                                             | **The main path** — every streamed asset on AWS, original and transformed alike                                                             |
| 2   | `api-file-manager/src/features/assetDelivery/StreamAssetReply/StreamAssetReply.ts:10`               | `public, max-age=31536000` (**365 d**)                                                             | Core/local streaming reply                                                                                                                  |
| 3   | `api-file-manager-s3/src/assetDelivery/s3/S3RedirectAssetReply.ts:10`                               | `public, max-age=${cacheDuration}` (caller-supplied)                                               | 301 redirect replies                                                                                                                        |
| 4   | `api-file-manager/src/features/assetDelivery/privateFiles/RedirectToPublicUrlOutputStrategy.ts:22`  | `public, max-age=2592000` (30 d)                                                                   | **Private files** — private→public redirect                                                                                                 |
| 5   | `api-file-manager/src/features/assetDelivery/privateFiles/RedirectToPrivateUrlOutputStrategy.ts:22` | `public, max-age=2592000` (30 d)                                                                   | **Private files** — public→private redirect                                                                                                 |
| 6   | `api-file-manager/src/features/assetDelivery/privateFiles/NotAuthorizedAssetReply.ts:9`             | `no-store`                                                                                         | 401/403 on private files                                                                                                                    |
| 7   | `api-file-manager/src/delivery/AssetDeliveryRoute.ts:13`                                            | `no-cache, no-store, must-revalidate`                                                              | Route-level 404s (`NO_CACHE_HEADERS`)                                                                                                       |
| 8   | `api-file-manager/src/features/assetDelivery/privateFiles/PublicCache.ts:17`                        | **rewrites only the `public`/`private` directive**, preserving whatever `max-age` is already there | Wraps the output strategy for public files                                                                                                  |
| 9   | `api-file-manager/src/features/assetDelivery/privateFiles/PrivateCache.ts:17`                       | same, inverted                                                                                     | Wraps the output strategy for private files                                                                                                 |
| —   | `event-handler-core/src/features/http/decorators/SecureHeadersDecorator.ts:43`                      | `public, max-age=86400`                                                                            | **OPTIONS preflight only** (`optionsResponse`, `:34`). The GET path at `:21` adds only CORS headers. **Not part of the asset TTL surface.** |

**There is no separate transform response path.** `SharpTransform` returns an `Asset` with a
different contents reader; the header is applied downstream by the same `S3OutputStrategy` →
`S3StreamAssetReply`. So a transformed image gets row 1, identical to an original.

**For the planned `max-age` / `s-maxage` split, rows 1 and 2 are mandatory and must change
together** (AWS and self-hosted must not diverge). Rows 4 and 5 are the private-file redirect path
and carry an independent 30-day literal — they need the same treatment or private files will behave
differently from public ones. Rows 8 and 9 are safe: they parse and re-stringify, so an added
`s-maxage` survives them untouched (`cache-control-parser` round-trip). Rows 3, 6, 7 are not asset
bodies and need no change.

_Confidence: High. Exhaustive grep for `cache-control` across the five relevant packages; each hit
read in context._

---

### 4.4 `srcPrefix` — per-tenant, and read only at URL construction

**Per tenant: yes.** File Manager settings are written through `KeyValueStore`, which scopes by
tenant — `packages/api-core/src/features/keyValueStore/KeyValueStore.ts:16`:

```ts
async get<T = unknown>(key: string, options?: IKeyValueStoreGetOptions) {
    const tenant = this.tenantContext.getTenant();
    return this.globalStore.get<T>(key, { scope: tenant.id, consistent: options?.consistent });
}
```

against key `FILE_MANAGER_GENERAL_SETTINGS = "FileManager/General"`
(`api-file-manager/src/domain/settings/constants.ts:1`), written by `UpdateSettingsUseCase:53`.
Seeded per tenant at install by `SettingsInstaller` (an `AppInstaller`, `alwaysRun = true`),
`SettingsInstaller.ts:31`:

```ts
const domain =
  manifest?.api?.cloudfront?.domain ?? this.buildParams.get<string>("WEBINY_API_URL") ?? "";
await this.updateSettings.execute({ srcPrefix: `${domain}/files` });
```

A trailing slash is normalised in exactly one place — `domain/settings/validation.ts:44`:
`return value.endsWith("/") ? value : value + "/";`

> Worth contrasting: delivery metadata uses **`GlobalKeyValueStore`** (scope `"global"`,
> `S3AssetResolver.ts:27`, `MetadataWriter.ts:20`), while settings use the **tenant-scoped**
> `KeyValueStore`. Different scopes, same underlying store.

**Read anywhere other than URL construction: no.** Every non-test reference:

| Site                                                                                                               | Purpose                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api-file-manager/src/features/file/FileUrlGenerator/FileUrlGenerator.ts:11` — `return this.srcPrefix + file.key;` | URL construction. Backs the `FmFile.src` GraphQL resolver (`FmGraphQLSchema.ts:363`) — **the server-side source of every `src` stored in content** |
| `app-file-manager/.../FileDetailsPresenter.ts:155` — `` `${srcPrefix}${this.file.key}` ``                          | URL construction (admin preview)                                                                                                                   |
| `app-file-manager/.../useCopyFile.tsx:23`                                                                          | URL construction (copy-to-clipboard)                                                                                                               |
| `app-file-manager/.../SettingsPresenter.ts`, `Get/SaveSettingsGateway.ts`, `FmGraphQLSchema.ts:97,103`             | The settings form and its GraphQL field                                                                                                            |
| `api-file-manager/.../GetSettingsUseCase.ts:20`                                                                    | default `srcPrefix: ""`                                                                                                                            |
| `SettingsInstaller.ts:37`                                                                                          | writes it at install                                                                                                                               |

Nothing parses it, branches on it, or persists it into content — it is only ever concatenated.
Also of note: the only subscriber to `SettingsAfterUpdateEvent` is audit logging
(`api-audit-logs/src/subscriptions/fileManager/handlers/AuditLogSettingsAfterUpdateHandler.ts`), so
**changing `srcPrefix` invalidates nothing** and leaves every already-stored `src` pointing at the
old prefix.

**Therefore a move to filename-less URLs is a code change, not a settings change.** The URL is
`srcPrefix + file.key`, and `file.key` is what carries `{id}/{filename}`. No value of `srcPrefix`
can drop the filename. Three concatenation sites would need to emit `srcPrefix + file.id` instead
(one server-side, two in admin) — and `CdnPathsGenerator` would need the §4.2 fix.

_Confidence: High. Exhaustive grep on `srcPrefix`; each hit read in context._

---

### 4.5 A latent bug that the locked plan must avoid: `keyPrefix`

Not asked, but it intersects the replacement flow directly.

`FileKey.toString()` (§3.1) supports an optional `keyPrefix`, producing
`{keyPrefix}/{id}/{filename}`. It is exposed publicly through the SDK —
`packages/sdk/src/methods/fileManager/createFile.ts:25`, `getPresignedPostPayload.ts:13`,
`createMultiPartUpload.ts:13`, `utils/uploadLargeFile.ts:29` — and through the GraphQL input
(`S3GraphQLSchema.ts:31`).

But delivery extracts the file ID as the **first** path segment
(`threatDetection/ObjectKey.ts:12`: `relativeKey().split("/")[0]`). With `keyPrefix = "p"`, the
request key is `p/{id}/{name}`, so `id()` returns `"p"`, the KV lookup for
`FileManager/File/p/Metadata` misses, and `S3AssetResolver` returns `undefined` → **404. The file is
undeliverable.**

The same off-by-one breaks `CdnPathsGenerator` (`/files/{id}/*` never matches `/files/p/{id}/…`)
and `DeleteS3FolderTask` (prefix `tenants/{t}/files/{id}/` never matches
`tenants/{t}/files/p/{id}/…`, so neither original nor derivatives are ever deleted).

Nothing in Webiny's own admin sets `keyPrefix`, so this is invisible in normal use — but it is a
supported SDK parameter. **Implication for the plan: the replacement flow must never set
`keyPrefix`, or the replaced file becomes unservable.**

_Confidence: High for the logic (three literals, read in context). Not observed at runtime — I did
not upload a file with a `keyPrefix` to confirm the 404._

---

### 4.6 Net effect on the locked plan

| Concern                                    | Status                                                                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New binary → clean derivatives             | **Already works.** Derivative keys embed the filename; a new key cannot collide with old derivatives (§4.1).                                                                                            |
| Stale derivatives served after replacement | **Cannot happen** in S3. Can happen at the CloudFront edge until invalidated.                                                                                                                           |
| Derivative cleanup                         | **Missing.** Orphans accumulate per replaced version; only file deletion clears the `{id}/` folder. Version history holding N previous keys makes this a real cost line — worth an explicit prune step. |
| Invalidation covers query variants         | Yes (§4.2), AWS-documented.                                                                                                                                                                             |
| Invalidation covers `/files/{id}`          | **No.** One-character fix in `CdnPathsGenerator` if filename-less URLs are adopted.                                                                                                                     |
| `max-age` / `s-maxage` split               | Must touch **4 literals**, not 1: `S3StreamAssetReply.ts:10`, `StreamAssetReply.ts:10`, and both private-file redirect strategies (§4.3).                                                               |
| Filename-less URLs                         | **Code change** in 3 concatenation sites; `srcPrefix` cannot do it alone (§4.4).                                                                                                                        |
| `keyPrefix`                                | **Must not be used** by the replacement flow — it breaks delivery, invalidation and deletion (§4.5).                                                                                                    |

---

### Open questions from Task 4

- Whether a trailing-`*` CloudFront invalidation genuinely purges query-string variants (§4.2).
  Verifiable only against a live distribution.
- Whether the eventual-consistency window on the delivery metadata read matters in practice.
  `S3AssetResolver.resolve` calls `keyValueStore.get(key)` with **no options**, and the store
  supports `{ consistent }` which maps to DynamoDB `ConsistentRead`
  (`api-core-ddb/src/keyValueStore/KeyValueStoreStorageOperations.ts:36`). So immediately after a
  `bucketKey` update, delivery can briefly resolve the **old** key. Passing `{ consistent: true }`
  would close it at some read cost — a decision for the replacement flow, not a finding.
- Actual storage cost of orphaned derivatives in a real environment. Needs S3 metrics, not code.

## Task 5 — Extension points for reference extraction (revised)

Scope: models `wbyWbPage`, `wbyWbVariant`, and all CMS models containing `asset`, `file`,
`rich-text`, `object` or `dynamicZone` fields.

### 5.1 Lifecycle hooks — and they receive **decoded** values

Every entry operation publishes a before/after pair. All definitions live under
`packages/api-headless-cms/src/features/contentEntry/<Operation>/events.ts`:

| Operation    | Event types                                                                   | Payload                             |
| ------------ | ----------------------------------------------------------------------------- | ----------------------------------- |
| Create       | `Cms/Entry/BeforeCreate`, `Cms/Entry/AfterCreate`                             | `{ entry, input, model }`           |
| Update       | `Cms/Entry/BeforeUpdate`, `Cms/Entry/AfterUpdate`                             | `{ entry, original, input, model }` |
| Publish      | `Cms/Entry/BeforePublish`, `Cms/Entry/AfterPublish`, `Cms/Entry/PublishError` | entry + model                       |
| Delete       | `Cms/Entry/BeforeDelete`, `Cms/Entry/AfterDelete`, `Cms/Entry/DeleteError`    | entry + model                       |
| New revision | `Cms/Entry/RevisionBeforeCreate`, `Cms/Entry/RevisionAfterCreate`, error      | entry + model                       |

Plus `UnpublishEntry`, `RepublishEntry`, `MoveEntry`, `DeleteEntryRevision`,
`DeleteMultipleEntries`, `RestoreEntryFromBin`, `UpdateRevisionDescription` — each with its own
events.ts.

**The values are fully decoded.** Events are published in the **UseCase**; the `toStorage` transform
happens inside the **Repository**, on a separate object.

`packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryUseCase.ts:51`

```ts
await this.eventPublisher.publish(new EntryBeforeCreateEvent({ entry, input, model }));
const result = await this.repository.execute(model, entry);
…
await this.eventPublisher.publish(new EntryAfterCreateEvent({ entry, input, model }));
```

`packages/api-headless-cms/src/features/contentEntry/CreateEntry/CreateEntryRepository.ts:22`

```ts
// Transform domain entry to storage format
const storageEntry = await this.entryToStorageTransform(model, entry);
// Persist to storage
await this.createEntryStorage.execute(model, { entry, storageEntry });
```

`entryStorageTransform` returns `{ ...entry, values: transformedValues }` (Task 1, `entryStorage.ts:86`)
— a **new** object — so `entry` is never mutated into storage form. The same ordering holds for
`UpdateEntryUseCase.ts:67/71/76`, `PublishEntryUseCase.ts:72/80/96` and
`DeleteEntryUseCase.ts:68/77/92`.

**So Task 1's gzip problem does not affect hooks at all.** No `fromStorage` call is needed — a
handler sees plain objects, decompressed rich-text included. The compression issue is confined to a
raw-table backfill, which these hooks let you avoid.

The payload also carries the full `model` (with `fields`), which is exactly what a traverser needs.

_Confidence: High. Read the use case / repository pair for all four operations._

---

### 5.2 Every revision? Private models?

**Revisions — you need three hooks, not one.** Editing in place fires `Update`. Creating a _new_
revision fires the `CreateEntryRevisionFrom` events (`Cms/Entry/RevisionBeforeCreate` /
`RevisionAfterCreate`), **not** Create or Update. Publish/Unpublish/Republish change which revision
is live without changing values. Minimum coverage for a reference index:
`AfterCreate` + `AfterUpdate` + `RevisionAfterCreate` + `AfterDelete`.

**Private models — yes, hooks fire.** `isPrivate` is consulted in exactly three places, all of them
API-surface concerns:

| File:line                                                     | Effect                                             |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `features/contentModel/ListModels/ListModelsRepository.ts:40` | `models.filter(model => model.isPrivate !== true)` |
| `graphql/schema/contentModelGroups.ts:79,95,117,131`          | hides private models/groups from GraphQL           |
| `export/crud/exporting.ts:30`                                 | excludes them from export                          |

Nothing in the entry use cases or the event publisher checks it. Confirmed empirically: WB pages and
variants are saved **through the CMS use cases**, so they emit the ordinary entry events —

`packages/api-website-builder/src/features/pages/UpdatePage/UpdatePageRepository.ts:2,35`

```ts
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
…
const result = await this.updateEntry.execute(this.pageModel, id, {
    location: data.location, system: data.system, values: data
});
```

Same for `CreateVariantRepository.ts:11` / `UpdateVariantRepository.ts:16` (`Create/UpdateEntryUseCase`)
and `GraduateVariantRepository.ts:16` (`CreateEntryRevisionFromUseCase`).

_Confidence: High._

---

### 5.3 Registry pattern for a per-field-type extractor

**No extractor registry exists**, but there is an established shape to copy, and — more usefully —
**the field-walking problem is already solved**.

**The walker: `ContentEntryTraverser`.**
`packages/api-headless-cms/src/features/contentEntry/ContentEntryTraverser/ContentEntryTraverser.ts:40`

```ts
async traverse<T extends CmsEntryValues = CmsEntryValues>(values: T, visitor: ContentEntryValueVisitor) {
    await this.visitTree<T>(this.modelAst, values, [], visitor);
}
```

It walks the **model AST in step with the value tree**, calling
`visitor({ field, value, path }, { node, parent })` for every field — descending into `object`
children (`:112`), list items with indexed paths (`:99-108`), and `dynamicZone` collections resolved
by discriminator (`findCollectionAndVisit`, `:124`). Obtained through a DI abstraction:
`ContentEntryTraverserProvider.getTraverser(modelId)`
(`ContentEntryTraverser/abstractions.ts:4`). Currently used by
`packages/api-headless-cms/src/graphql/schema/resolvers/manage/normalizeGraphQlInput.ts:26` and one
test. **This is precisely the "walk the model tree in step with the value tree" requirement Task 1
identified.**

**The registry shape to copy — the established one for server-side per-field-type behaviour is
`StorageTransform`:**
`packages/api-headless-cms/src/features/storage/StorageTransformRegistry.ts:18`

```ts
let transform = this.transforms.find(item => item.fieldType === fieldType);
const baseType = getBaseFieldType({ type: fieldType });
if (!transform && baseType !== fieldType) {
  transform = this.transforms.find(item => item.fieldType === baseType);
}
```

registered via DI multi-injection (`:45`): `dependencies: [[StorageTransform, { multiple: true }]]`,
with resolution order exact → base type → `*` default (`entryStorage.ts:31-42`,
`DefaultStorageTransform.ts:4`). A plugin adds a field type by shipping one more
`StorageTransform.createImplementation({...})`. This is the pattern to mirror for a
`FileReferenceExtractor` abstraction.

Other candidates, and why they are not the one:

| Registry                                                                                                            | File                                                   | Why not                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `CmsModelFieldToGraphQLRegistry`                                                                                    | `features/graphql/fields/…` (e.g. `AssetToGraphQL.ts`) | Same shape and equally established, but its concern is schema generation, not value handling |
| `FieldFilterCreateRegistry`, `FieldSortingRegistry`, `FieldFilterPathRegistry`, `FieldFilterValueTransformRegistry` | `@webiny/api-headless-cms-storage`                     | Storage-internal, used by `DdbListEntries.ts:37-38`; narrower concern                        |
| `FieldBuilderRegistry` / `FieldType`                                                                                | `features/modelBuilder/fields/`                        | Model authoring, not per-entry value behaviour                                               |

_Confidence: High._

---

### 5.4 One registration point covering both Website Builder and Headless CMS

**It already exists, and it is simpler than a cross-app abstraction: Website Builder content _is_
Headless CMS content.** `wbyWbPage` and `wbyWbVariant` are private CMS models (Task 1) written
through `Create/Update/CreateEntryRevisionFromUseCase` (§5.2). So **a single
`EntryAfterUpdateEventHandler` implementation covers WB pages, WB variants, and every user-defined
model at once.** There is no second integration to write.

Website Builder _also_ publishes its own higher-level events —
`packages/api-website-builder/src/features/pages/*/events.ts` (`page.beforeUpdate`,
`page.afterUpdate`, `page.afterPublish`, `page.afterCreateRevisionFrom`, …), published in the WB use
case (`UpdatePageUseCase.ts:46/49/62`, same before-repository ordering). Those are available if you
want page-shaped payloads, but they cover pages only — variants and CMS models would each need
separate wiring. **Listening at the CMS entry level is one registration instead of three.**

Registration mechanism is the standard DI one: implement the event's handler abstraction
(`EntryAfterUpdateEventHandler.createImplementation({ implementation, dependencies })`) and register
it in a `createFeature` block — the pattern documented by the `webiny-event-handler-pattern` and
`webiny-full-stack-architect` skills.

_Confidence: High._

---

### 5.5 Backfill: the resumable-iteration precedent (with one gap)

**The pattern is `EntriesBulkAction`** —
`packages/api-headless-cms-bulk-actions/src/features/EntriesBulkAction/abstractions.ts:23`

```ts
export interface IEntriesBulkAction<TData = Record<string, any>> {
  readonly name: string;
  readonly modelIds?: string[];
  readonly batchSize?: number;
  loadData(model: CmsModel, params: IBulkActionListParams): Promise<IBulkActionListResult>;
  processData(model: CmsModel, params: IBulkActionProcessParams<TData>): Promise<void>;
}
```

with `IBulkActionListParams = { where?, search?, after?, limit? }` — cursor-based.

Driven by `createBulkActionTasks.ts` (a `TaskDefinition`) through a parent/child task split:

- `CreateTasksByModel.ts` pages through entries and spawns child tasks in batches of up to
  `MAX_TASK_LIST_LENGTH = 10`.
- Cursor advance (`:121`): `listEntriesParams.after = meta.cursor;`
- Timeout survival (`:56`):
  ```ts
  } else if (controller.runtime.isCloseToTimeout()) {
      await this.taskCache.triggerTask(this.triggerTask, controller.state.getTask());
      return controller.response.continue({ ...input, action: BulkActionOperationByModelAction.PROCESS_SUBTASKS });
  }
  ```
- `ProcessTasksByModel.ts` polls children and re-continues with a 120 s delay until they drain, then
  loops back to `CHECK_MORE_SUBTASKS` (`createBulkActionTasks.ts:79`).
- Progress reporting precedent: `packages/api-headless-cms-tasks/src/graphql/deleteModel/getDeleteModelProgress.ts`.

> **Gap you must close.** `CreateTasksByModel` advances the cursor **only in a local variable**. On
> continuation it returns `{ ...input, action: … }` with `input.after` **unchanged** (`:57-62`,
> `:113-118`). That is safe for the shipped bulk actions because they _mutate what they scan_
> (delete / publish / move / trash), so a re-scan with the same `where` naturally returns the
> remainder. `DeleteModelTask` has the same destructive-scan shape with no cursor at all
> (`packages/api-headless-cms-tasks/src/features/DeleteModelTask/DeleteModel.ts:43,57` — `limit: 1000`,
> continue-on-timeout, delete-as-you-go).
>
> A reference backfill is **read-only and idempotent**, so re-scanning from an unchanged cursor
> restarts the pass on every timeout and never converges. The backfill must persist the cursor into
> its own continued input. **Exact precedent for that:**
> `packages/api-file-manager-s3/src/features/DeleteFileFromBucket/DeleteS3FolderTask.ts:72`
>
> ```ts
> if (filesList.IsTruncated && filesList.NextContinuationToken) {
>   return controller.response.continue({
>     ...input,
>     continuationToken: filesList.NextContinuationToken
>   });
> }
> ```

General `TaskDefinition` surface (from §3.4/§3.5 and the above): `id`, `title`, `maxIterations`,
`isPrivate`, `selfCleanup`, and `controller.response.{continue,done,error,aborted}` +
`controller.runtime.{isAborted,isCloseToTimeout}` + `controller.state.getTask()`.

_Confidence: High for the mechanics. High for the cursor gap — read directly from the two
continuation sites._

---

### 5.6 Where reference records could live

Three options are genuinely available to a server-side plugin.

#### (a) Private CMS model

Precedent is everywhere: `file.model.ts`, `page.model.ts`, `variant.model.ts`, `experiment.model.ts`,
`theme.model.ts`, `WbyRemoteComponentModel.ts`, and five models in `api-component-extraction`.
`isPrivate` only removes it from GraphQL and model listings (§5.2); the use cases work normally.

**Query cost is backend-dependent, and that is the deciding factor.**

- **DynamoDB-only** — `packages/api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts:61`
  ```ts
  const partitionKey = createGSIPartitionKey(model, type);
  storageEntries = await this.entity.queryAll({ index: "GSI1", … });
  ```
  followed by in-memory `filter(...)` (`:138`) and `sort(...)` (`:157`). Every list call reads
  **every entry of the model** into Lambda memory before filtering. Querying by file ID or by source
  ID therefore costs a full scan of the entire reference index. **Unusable at any real scale.**
- **DynamoDB + OpenSearch (or PG + OS)** — `DdbEsListEntries.ts` builds a real OpenSearch query
  (`CmsEntryOpenSearchBodyBuilder`, `createLimit`, cursor pagination). Both access patterns are
  indexed lookups. Note: store the ids as plain `text` fields — `asset` and `file` field types
  declare `isSearchable = false` (`AssetToGraphQL.ts:149`, `FileToGraphQL.ts:25`).

Gets you free: tenancy/locale scoping, revisions, ACO folders, lifecycle events, admin tooling.

#### (b) Direct DynamoDB with a GSI

Precedent is the `-ddb` sibling-package pattern; the cleanest small example is
`packages/api-core-ddb/src/keyValueStore/KeyValueStoreStorageOperations.ts` +
`KeyValueStoreDynamoTable.ts`. `@webiny/db-dynamodb` exports what you need
(`DynamoDBClient`, `DynamoDbDriver`, `FilterUtilFeature`, `registerDynamoDBCore`).

**Cost: by file ID = one `Query` on `PK = FILE#{fileId}`. By source ID = one `Query` on a GSI with
`PK = SOURCE#{sourceId}`.** Both O(matching items), natively paginated, and **identical on every
deployment backend**. This is the only option that is cheap on _both_ access patterns without
OpenSearch.

Costs you: your own storage-operations abstraction per backend (ddb / sql / pg — mirroring how
`api-core-ddb`, `api-core-sql` are split), tenancy scoping by hand, migrations, and no admin tooling.

#### (c) Key-value store

`GlobalKeyValueStore` (scope `"global"`) / `KeyValueStore` (scope `tenant.id`) —
`packages/api-core/src/features/keyValueStore/`, backed by
`packages/api-core-ddb/src/keyValueStore/KeyValueStoreStorageOperations.ts`. The full surface is
`get` / `set` / `delete` on a single `{scope}:{key}`, with TTL (`expiresAt`) and an optional
`consistent` read. **There is no list, no query, and no prefix scan.**

**Cost: O(1) point read in either direction — but only if you write both directions explicitly**
(`refs/file/{fileId}` → sources, `refs/source/{sourceId}` → files) and keep them in sync on every
save. Limits: each value is one DynamoDB item, so a **400 KB hard ceiling** per key, no pagination,
and the dual write is non-atomic. Workable for a bounded "which pages use this file" lookup; wrong
for an unbounded index.

#### Summary

| Option            | By file ID                                                        | By source ID                 | Backend-independent | Build cost                                 |
| ----------------- | ----------------------------------------------------------------- | ---------------------------- | ------------------- | ------------------------------------------ |
| Private CMS model | O(1) indexed **with OpenSearch**; **full model scan on DDB-only** | same                         | ✗                   | Lowest                                     |
| Direct DDB + GSI  | One `Query`                                                       | One `Query` (GSI)            | ✓                   | Highest                                    |
| Key-value store   | O(1) point read                                                   | O(1) point read (second key) | ✓                   | Low, but 400 KB/key ceiling, no pagination |

_Confidence: High. Read from the DDB and OpenSearch list implementations and the KV storage
operations._

---

### Open questions from Task 5

- Whether `EntryAfterUpdate` fires for entries mutated by bulk actions and background tasks
  (they call the same use cases, so it should — but I traced only the interactive paths).
  Resolvable by reading `DeleteEntriesBulkAction` / `PublishEntriesBulkAction` implementations.
- Whether ACO (`api-aco`) decorates the entry use cases in a way that changes event payloads for
  models that live in folders. Not traced.
- Expected reference-index cardinality, which decides between (a) and (b) in §5.6. Product input,
  not code.

---

## Task 6 — Storage portability for the reference index

Task 5 weighed storage against the DynamoDB vs DynamoDB+OpenSearch axis only. This section adds
the Standalone (self-hosted) backend, which does not use DynamoDB at all.

### 6.1 What backs Standalone storage, and where the paths diverge

Standalone is a **single long-running Node HTTP server backed by SQL** — no AWS, no Pulumi, no
`deploy`. Stated verbatim in the project template
(`packages/create-webiny-project/_templates/server/postgres/webiny.config.tsx:9`):

```
Self-hosted (server) hosting-type project extensions. No AWS, no Pulumi, no `deploy` — a single
long-running Node HTTP server backed by SQL storage. Run it with `yarn webiny watch`.
```

| Concern          | AWS                                          | Standalone                                                                        |
| ---------------- | -------------------------------------------- | --------------------------------------------------------------------------------- |
| Database         | DynamoDB (single table), optional OpenSearch | **SQL via knex** — SQLite (`better-sqlite3`) or PostgreSQL (`pg`)                 |
| Templates        | `_templates/aws`                             | `_templates/server/sqlite`, `_templates/server/postgres`                          |
| Infra extensions | Pulumi app modules                           | `packages/project-server/src/extensions/{Postgres,Sqlite,FileStorage,ApiUrl}.tsx` |
| Files            | S3 + CloudFront                              | `Infra.FileStorage` → local disk (`./.webiny/storage`)                            |
| Auth             | Cognito                                      | `@webiny/self-hosted-auth` (built-in IdP + JWT)                                   |

Only one knex driver ships per build — `packages/project-server/src/deploy/PruneUnusedDbDriver.ts:13`
prunes the unused one ("a Postgres build ships no `better-sqlite3`, a SQLite build no `pg`").

**The divergence point is `createWebinyApiHandler`'s `registerRootStorage` callback.** Three
composition roots exist, one per storage combination:

`packages/api-event-handler-server-sql/src/createWebinyApiHandler.ts:43`

```ts
registerRootStorage: async container => {
  ApiCoreSqlFeature.register(container, { knex, tableNamePrefix });
  WebsocketsSqlFeature.register(container, { tableNamePrefix });
  SelfHostedAuthSqlFeature.register(container, { knex, tableNamePrefix });
  SelfHostedAuthApiFeature.register(container);
  HeadlessCmsSqlFeature.register(container, { knex, tableNamePrefix });
  await registerExtensions(container, [
    registerSQLCore({ knex }),
    registerAcoSqlStorageOperations({ knex, tableNamePrefix }),
    registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix })
  ]);
};
```

`packages/api-event-handler-aws-ddb/src/createWebinyApiHandler.ts:22`

```ts
registerRootStorage: (container, { documentClient }) => {
  ApiCoreDdbFeature.register(container, { documentClient });
  HeadlessCmsDdbFeature.register(container);
  AuditLogsDdbFeature.register(container, {});
  AcoDdbFeature.register(container);
  WebsocketsDdbFeature.register(container);
};
```

plus `packages/api-event-handler-aws-ddb-os/src/createWebinyApiHandler.ts`.

**The lowest layer with more than one implementation is the per-feature storage-operations
Feature** — `ApiCoreDdbFeature` vs `ApiCoreSqlFeature`, `HeadlessCmsDdbFeature` vs
`HeadlessCmsSqlFeature`, and so on. Above that line everything is shared; below it, nothing is.
**There is no common database abstraction beneath it** — `@webiny/db-dynamodb` has no SQL
counterpart implementing the same interface. Portability is achieved by writing the concern twice,
not by an adapter.

_Confidence: High. Read both composition roots and the template._

---

### 6.2 CMS entry persistence: a shared interface, but four full implementations

**Yes, it sits behind an interface** — 22 per-operation abstractions in
`packages/api-headless-cms/src/features/shared/storageOperations/entry/`:
`CreateEntryStorageOperation.ts`, `ListEntriesStorageOperation.ts`, `PublishEntryStorageOperation.ts`,
`MoveToBinStorageOperation.ts`, … each a `createAbstraction` implemented per backend.

| Implementation        | Path                                                                | Files |
| --------------------- | ------------------------------------------------------------------- | ----- |
| DynamoDB              | `packages/api-headless-cms-ddb/src/operations/entry/` (`Ddb*`)      | 27    |
| DynamoDB + OpenSearch | `packages/api-headless-cms-ddb-es/src/operations/entry/` (`DdbEs*`) | 29    |
| SQL (Standalone)      | `packages/api-headless-cms-sql/src/operations/entry/` (`Sql*`)      | 26    |
| Postgres + OpenSearch | `packages/api-headless-cms-pg-os/src/operations/entry/` (`PgOs*`)   | 18    |

So the interface is real, but it is **not a thin adapter** — each backend reimplements the whole
operation set. That is the honest cost baseline for any new storage concern.

_Confidence: High._

---

### 6.3 KeyValueStore: the one already-portable primitive

**Yes, it has a Standalone implementation, and it is backend-agnostic by design.**

| Layer                 | Path                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Abstraction           | `packages/api-core/src/features/keyValueStore/abstractions.ts` (`IKeyValueStorageOperations`)               |
| Tenant-scoped service | `packages/api-core/src/features/keyValueStore/KeyValueStore.ts` (`scope: tenant.id`)                        |
| Global service        | `packages/api-core/src/features/keyValueStore/GlobalKeyValueStore.ts` (`scope: "global"`)                   |
| DynamoDB impl         | `packages/api-core-ddb/src/keyValueStore/KeyValueStoreStorageOperations.ts` + `KeyValueStoreDynamoTable.ts` |
| SQL impl              | `packages/api-core-sql/src/keyValueStore/index.ts`                                                          |

The SQL implementation (`api-core-sql/src/keyValueStore/index.ts:9`):

```ts
const TABLE_NAME = "webiny_core_key_value";
…
return tableManager.ensure(TABLE_NAME, table => {
    table.text("scopedKey").primary().notNullable();
    table.text("key").notNullable();
    table.text("scope").notNullable();
    table.text("value").notNullable();
    table.datetime("expiresAt");
});
```

`api-core-ddb` and `api-core-sql` have **identical directory structures** — `keyValueStore`,
`security`, `tenancy`, `adminUsers`, `serviceDiscovery` — which is the clearest expression of the
paired-package pattern in the repo.

Consequence for Tasks 3 and 4: **the asset-delivery metadata (global scope) and File Manager
settings (tenant scope) already work on Standalone with no extra work.** This is the only storage
primitive available to a plugin that needs zero per-backend code — but, per Task 5 §5.6, it offers
no list, no query and no prefix scan.

_Confidence: High._

---

### 6.4 Features that own storage outside CMS entries

| Feature                                                        | AWS impl                                                     | Standalone impl                    | Count | Added (AWS / SQL)             |
| -------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------- | ----- | ----------------------------- |
| api-core (KV, security, tenancy, adminUsers, serviceDiscovery) | `api-core-ddb`                                               | `api-core-sql`                     | 2     | 2026-07-02 / 2026-07-02       |
| Headless CMS                                                   | `api-headless-cms-ddb`, `-ddb-es`                            | `-sql`, `-pg-os`                   | 4     | — / 2026-07-29                |
| ACO / folders                                                  | `api-aco-ddb`                                                | `api-aco-sql`                      | 2     | 2026-07-02 / 2026-06-10       |
| Audit logs                                                     | `api-audit-logs-ddb`                                         | `api-audit-logs-sql`               | 2     | 2026-07-02 / 2026-06-10       |
| Websockets                                                     | `api-websockets-ddb` (+ `-aws` transport)                    | `api-websockets-sql` (+ `-server`) | 2     | 2026-07-02 / 2026-07-02       |
| Background tasks                                               | `api-background-tasks-ddb`, `-os` (+ `background-tasks-aws`) | (+ `background-tasks-server`)      | 2     | 2026-07-02 / `-os` 2024-01-09 |
| Self-hosted auth                                               | —                                                            | `self-hosted-auth-sql`             | 1     | Standalone-only, 2026-07-07   |

**Every storage-owning feature follows the paired-package pattern.** No feature outside CMS entries
has only one implementation except `self-hosted-auth` (which exists only for Standalone) and
`api-background-tasks-os` (dated 2024-01-09 — the outlier predating the split).

**The most recently added pattern is the paired `-ddb` / `-sql` Feature package.** `api-core-ddb`
and `api-core-sql` were introduced **on the same day** (2026-07-02) — the DynamoDB side was
refactored _into_ the paired shape at the moment the SQL side was created — and
`api-headless-cms-sql` / `api-headless-cms-pg-os` are the newest of all (2026-07-29). So the current,
intended way to add a storage concern is: abstractions in the feature package, one `-ddb` and one
`-sql` implementation package, both registered from the matching `createWebinyApiHandler`.

_Confidence: High for the structure. Dates are `git log --diff-filter=A` on each package directory,
so they record when the directory first appeared, not necessarily when the design was settled._

---

### 6.5 AWS single-table design, GSIs, and adding one

`packages/project-aws/src/pulumi/apps/core/CoreDynamo.ts` — one table named `"webiny"`,
`hashKey: "PK"`, `rangeKey: "SK"`, `PAY_PER_REQUEST`, TTL on `expiresAt`, and **three GSIs**:

| Index        | Keys                     | Projection  |
| ------------ | ------------------------ | ----------- |
| `GSI_TENANT` | `GSI_TENANT` (hash only) | `KEYS_ONLY` |
| `GSI1`       | `GSI1_PK` / `GSI1_SK`    | `ALL`       |
| `GSI2`       | `GSI2_PK` / `GSI2_SK`    | `ALL`       |

**Registration point for a new entity: there isn't one — it is convention.** A feature calls
`createTable({ name: process.env.DB_TABLE })` and `createGlobalEntity({ name, table, attributes })`
(`packages/db-dynamodb/src/utils/createEntity.ts:16`, `globalEntityAttributes` exposing
`GSI1_PK/SK`, `GSI2_PK/SK`, `GSI_TENANT`) and picks its own key prefixes. Smallest example —
`packages/api-core-ddb/src/keyValueStore/KeyValueStoreDynamoTable.ts:26`:

```ts
createKeys({ scopedKey }: CreateKeysParams) {
    return { PK: `KV#${scopedKey}`, SK: `A` };
}
```

**You almost certainly do not need a new GSI.** `GSI1` and `GSI2` are already _shared_ across
features by PK prefix:

- `packages/api-aco-ddb/src/FolderLevelPermissionsStorageOperations.ts:234` — `GSI2_PK: \`T#${tenant}#FLP\``
- `packages/api-audit-logs-ddb/src/entity.ts:13` — its own `GSI2_PK` / `GSI2_SK`
- `packages/api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts:61-63` — `createGSIPartitionKey(model, type)` then `queryAll({ index: "GSI1", … })`

A reference index would simply claim its own prefix (e.g. `GSI1_PK: FILEREF#T#{tenant}#F#{fileId}`)
and query `index: "GSI1"`.

**If you did add `GSI3`:** it is a Pulumi edit to `CoreDynamo.ts` → an `UpdateTable` call → **yes, a
deployment is required**. And **nothing in this repo backfills DynamoDB items into a new index.**
DynamoDB backfills an added GSI automatically, but only for items that already carry the index's key
attributes — pre-existing items would have no `GSI3_PK` and so would never be indexed; an
application-level rewrite pass would be needed. The only reindex machinery that exists is for
OpenSearch, not DynamoDB: `packages/api-search-index-tasks/src/tasks/reindex/ReindexTask.ts` and
`createIndexes/CreateIndexesTask.ts`.

> The DynamoDB auto-backfill semantics and the one-GSI-per-UpdateTable limit are AWS-documented
> behaviour, **not verifiable from this repo**. Confidence Medium on those two sentences; High on
> everything else in this subsection.

---

### 6.6 Standalone: table creation and the absence of migrations

Tables are created **lazily, at first use** — `packages/api-core-sql/src/TableManager.ts:31`:

```ts
public async ensure(tableName: string, creator: (table: Knex.CreateTableBuilder) => void): Promise<void> {
    const resolved = this.resolve(tableName);
    if (this.verified.has(resolved)) { return; }
    const exists = await this.knex.schema.hasTable(resolved);
    if (!exists) { await this.knex.schema.createTable(resolved, creator); }
    this.verified.add(resolved);
}
```

Callers invoke it per operation — e.g. `SqlListEntries.ts:42`: `await this.entryTableManager.ensureTable();`

**There is no migration system.** Repo-wide greps for `knex.migrate`, `migrations`, `alterTable` and
`schema.alter` across `api-core-sql`, `api-headless-cms-sql` and `db-utils` return nothing, and
there is no `migrations/` directory anywhere outside `node_modules`.

**What happens on upgrade against an existing local database: nothing.** `ensure()` is
create-if-not-exists; when the table already exists the `creator` callback never runs. A new column
or index added to an existing table definition has **no effect** on a database created by an earlier
version — the schema is frozen at first creation. In practice a schema change to an existing
Standalone database requires dropping the table (or a hand-written migration) by the operator.

(`TableManager` also caches verification in-process via `this.verified` and registers itself on
`globalThis.__sqlTableManagers` with a `reset()` — a test hook, not a migration path.)

_Confidence: High. Negative grep plus reading the implementation._

---

### 6.7 Search index in Standalone: the packages exist but are not wired

**A shipped Standalone project has no search index today.**

The building blocks are real: `packages/api-headless-cms-pg-os` (18 entry operations),
`api-headless-cms-utils-os`, `api-sync-pg-to-opensearch`, `api-opensearch`. And
`api-headless-cms-pg-os/src/operations/entry/EntrySearchOperations.ts` wires `list`, `get` and
`getUniqueFieldValues` to OpenSearch through the same `CmsEntryOpenSearchBodyBuilder` used by
`ddb-es` — so filtering really is pushed down there.

**But nothing references it.** Grepping every `.ts`/`.tsx` outside the package itself for
`HeadlessCmsPgOs|api-headless-cms-pg-os` returns **zero hits**. There is no
`api-event-handler-server-sql-os` composition root, and neither Standalone template mentions
OpenSearch. The only server composition root registers `HeadlessCmsSqlFeature`.

**What Standalone does instead for list and filter** —
`packages/api-headless-cms-sql/src/operations/entry/queryHelpers.ts:133`:

```ts
const qb = createEntryQuery(deps.knex, deps.tableName)
    .where("tenant", model.tenant)
    .andWhere("modelId", model.modelId);
if (initialWhere.entryId) { qb.andWhere("entryId", initialWhere.entryId); }
else if (initialWhere.published === true) { qb.andWhere("isPublished", true); }
else { qb.andWhere("isLatest", true); }
…
const rows: IEntryRow[] = await qb;                              // ← no LIMIT
…
entry.values[field.fieldId] = await fromStorage(field, …);       // ← decompresses EVERY row
…
const filteredItems = filter<T>({ items: records, where, … });   // ← in JS
const sortedItems = sort<T>({ … });                              // ← in JS
const slicedItems = sortedItems.slice(start, start + limit);     // ← paginate afterwards
```

Only structural predicates (`tenant`, `modelId`, `entryId`, `isPublished`/`isLatest`, `wbyDeleted`)
reach SQL. Every field-level filter runs in JavaScript.

**This is the same in-memory pattern as DynamoDB-only, and in two respects worse: the SQL query
carries no `LIMIT`, and `fromStorage` gzip-decompression runs on every row before filtering.**
Task 5's objection to a private CMS model therefore applies to Standalone at least as strongly as to
DynamoDB-only — it was not a DynamoDB-specific defect.

_Confidence: High._

---

### 6.8 Cloudflare Workers: nothing exists

A repo-wide grep for `cloudflare|Cloudflare|workerd|wrangler` across `.ts`, `.tsx`, `.json` and `.md`
(excluding `node_modules` and `dist`) returns four hits, **none of which is a target**:

| Hit                                                                | What it actually is                                                                                              |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `packages/site-capture/src/browser/botChallenge.ts` (+ `.test.ts`) | Detecting Cloudflare bot-challenge interstitials while crawling third-party sites                                |
| `packages/site-capture/src/browser/ChromiumBrowserProvider.ts`     | Same                                                                                                             |
| `packages/project-server/src/deploy/PruneUnusedDbDriver.ts:28`     | `pg-cloudflare` listed as a transitive dependency of the `pg` npm package, so it gets pruned from a SQLite build |

No `wrangler.toml`, no D1 driver, no worker entry point, no interface or hosting-type named for it.
**There is no scaffolding or documented intent for a Cloudflare Workers target in this repo**, so
nothing on that axis constrains the storage choice today.

_Confidence: High — this is a negative result, and negative results are only as good as the search.
I grepped the four obvious keywords across source, config and docs._

---

### 6.9 Recommendation

**Task 5's conclusion survives, but its reasoning generalises rather than narrows.** The objection
to a private CMS model was "full model scan on DynamoDB-only." Standalone SQL has the same defect —
without even a `LIMIT`, and with gzip decompression per row (§6.7). A CMS-model reference index is
therefore **unindexed on both default backends**; the only configurations where it is cheap are
`ddb-es` and the currently unwired `pg-os`.

But "put it in DynamoDB with a GSI" is AWS-only, and there is no shared abstraction below the
per-feature storage-operations layer to hide that (§6.1).

**Recommendation: follow the established paired-Feature pattern.** Define
`ReferenceIndexStorageOperations` abstractions in the feature package; ship one `-ddb` and one
`-sql` implementation; register both from the two `createWebinyApiHandler` roots. This is what
api-core, ACO, audit-logs and websockets all do, and it is the most recently added pattern in the
repo (§6.4).

**Cost on AWS: low.**

- No new GSI. Reuse `GSI1` with a `FILEREF#` prefix, exactly as ACO and audit-logs share `GSI2` (§6.5).
- One entity via `createGlobalEntity`; by-file-ID on the base table `PK`, by-source-ID on `GSI1` (or vice versa). Both are single `Query` calls.
- No deployment beyond the normal one, and no index-backfill problem — because no index is added.

**Cost on Standalone: moderate but bounded.**

- One knex table created through `TableManager.ensure()`, with real B-tree indexes on `fileId` and `sourceId`. Both access patterns are genuinely indexed.
- **This is the one place Standalone comes out ahead of the CMS-model route**, because you control the schema instead of inheriting filter-in-JS.
- The real constraint is §6.6: with no migration system, the columns and indexes must be right the first time. An existing Standalone database will never pick up a later schema change without operator intervention.

**Unavoidable cost:** the concern is written twice (a third time if `pg-os`-style search ever becomes
the Standalone default), and you own tenancy scoping and pagination by hand in both.

**If writing it twice is not acceptable**, the fallback is a private CMS model _plus real
mitigation_ — and the mitigation should be the key-value store, not a scan:

- Keep the by-file-ID lookup off the list path entirely: maintain a reverse index at
  `refs/file/{fileId}` in the key-value store, which is already portable across both backends with
  zero new per-backend code (§6.3) and is O(1) on each.
- Use the CMS model as the durable record and for the by-source-ID query, which is naturally bounded
  (the references belonging to one entry) and so tolerates the in-memory filter.
- This caps the key-value store's 400 KB-per-key exposure at "references to a single file", which is
  a plausible bound, and avoids the unbounded scan entirely.

Choosing between them: take the paired-package route if the reference index is a first-class feature
with unbounded cardinality and its own query surface; take the KV-plus-CMS-model route if avoiding
per-backend code matters more and a per-file ceiling is acceptable.

---

### Open questions from Task 6

- Whether `api-headless-cms-pg-os` is intended to become a shipped Standalone configuration, which
  would change the CMS-model cost calculus on Standalone entirely. The package exists and is
  complete-looking but is wired to nothing (§6.7) — this is a roadmap question, not a code one.
- Whether a fourth backend is planned (the `-sql` split is only ~2 months old at the time of
  writing), which would change how much "written twice" really costs.
- Whether operators are expected to hand-migrate Standalone databases on upgrade, or whether the
  absence of a migration system (§6.6) is a known gap with a plan behind it.

---

## What could not be determined from the code

| Question                                                                                        | Why                                                                 | What would settle it                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Whether a trailing-`*` CloudFront invalidation purges query-string variants (§4.2)              | AWS edge behaviour, not in this repo                                | Issue an invalidation against a live distribution and re-request a `?width=` variant |
| Whether any deployed bucket has S3 versioning enabled out-of-band (§3.5)                        | Pulumi shows intent, not deployed state                             | `aws s3api get-bucket-versioning` on a real environment                              |
| Whether tenant `settings.logo` / `settings.favicon` are written by any project extension (§1.3) | `TenantSettings` is `Record<string, any>`; no writer in `packages/` | Grep a real project's `extensions/`, or dump a tenant record                         |
| Whether stored `Asset.url` values drift from `image.crop` in existing content (§1.3)            | Only observable in real data                                        | Inspect page documents / entries in a live environment                               |
| Whether `bindings[el].metadata.backgroundImage` drifts from the style value (§1.1)              | Same                                                                | Same                                                                                 |
| Real hit-rate split between the 30-day edge cache and the 1-year browser cache (§3.4)           | Runtime metric                                                      | CloudFront metrics                                                                   |
| Storage cost of orphaned derivatives (§4.1)                                                     | Runtime metric                                                      | S3 storage metrics by prefix                                                         |
| Whether the KV eventual-consistency window matters after a `bucketKey` update (§3.6, §4.6)      | Depends on real traffic timing                                      | Load test, or simply pass `{ consistent: true }` and measure the latency cost        |
| Expected reference-index cardinality (§5.6)                                                     | Product decision                                                    | Product input                                                                        |
| Whether DynamoDB auto-backfills an added GSI, and the one-GSI-per-UpdateTable limit (§6.5)      | AWS behaviour, not in this repo                                     | AWS docs, or add a GSI to a test table and observe                                   |
| Whether `api-headless-cms-pg-os` is intended to ship as a Standalone configuration (§6.7)       | Package is complete but wired to nothing                            | Roadmap question for the team                                                        |
| Whether the absence of a Standalone migration system (§6.6) is a known gap with a plan          | Only the absence is verifiable                                      | Team                                                                                 |
