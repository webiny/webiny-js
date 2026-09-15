# markitdown Lambda Layer for Document-to-Markdown Conversion

## Problem

AI PowerUps lets users attach files (PDF, DOCX, etc.) to AI prompts. These files are converted to markdown so the LLM can read them as context. Our current approach has two converters:

- **DOCX**: Custom XML parser in `packages/api-core/src/features/ai/TextExtractor/parsers/docxParser.ts`. Works, but is a hand-rolled parser that we maintain ourselves.
- **PDF**: Has been through three iterations (`pdfjs-dist` direct, `@pdf2md/core`, `unpdf`). Every approach hits the same wall: pdfjs-dist doesn't survive rspack/SWC minification in production builds (class names get mangled, dynamic worker imports fail). Even when the parser runs, PDF lacks semantic heading info, so the output is structurally worse than DOCX.

We need a single, reliable converter that handles multiple formats without bundler compatibility issues.

## Proposed Solution

Use Microsoft's [markitdown](https://github.com/microsoft/markitdown) (MIT license) as an AWS Lambda layer. markitdown is a Python tool that converts documents to markdown. It uses mature, pure-Python backends (pdfminer.six for PDF, mammoth for DOCX) that don't depend on native libraries.

Since it runs as a Python process, it is completely decoupled from our Node.js bundler pipeline — no minification issues, no worker file resolution problems.

## Scope

### Formats to support (initial)

| Format | markitdown backend | Notes                       |
| ------ | ------------------ | --------------------------- |
| PDF    | pdfminer.six       | Pure Python, no native deps |
| DOCX   | mammoth            | Pure Python, no native deps |

### Formats available for future expansion

PPTX, XLSX, HTML, images (with optional OCR), audio transcription. These can be enabled by adding the corresponding markitdown extras to the layer.

### Out of scope

- Plain text files (.txt, .md, .csv) — these are already handled without conversion.
- Image OCR and audio transcription — require additional native dependencies and would significantly increase layer size.

## Architecture

### Lambda Layer

```
markitdown-layer/
  python/
    markitdown/
    pdfminer/
    mammoth/
    ... (transitive deps)
```

**Build process:**

```bash
pip install 'markitdown[pdf,docx]' -t python/
zip -r markitdown-layer.zip python/
```

Expected size: ~20-30 MB (well under the 250 MB Lambda layer limit).

The layer is attached to the API Lambda functions that run AI PowerUps tasks (background task workers).

### Node.js Bridge

Replace the `TextExtractor` implementation to shell out to markitdown via `child_process`:

```ts
import { execFile } from "node:child_process";

async function convertToMarkdown(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeTypeToExtension(mimeType); // e.g., ".pdf", ".docx"

  return new Promise((resolve, reject) => {
    const proc = execFile(
      "python3",
      ["-m", "markitdown", "--extension", ext],
      { maxBuffer: 10 * 1024 * 1024 },
      (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout);
      }
    );
    proc.stdin?.end(buffer);
  });
}
```

markitdown reads from stdin and writes markdown to stdout. The `--extension` flag tells it the input format when reading from stdin.

### TextExtractor Integration

`DefaultTextExtractor` in `packages/api-core/src/features/ai/TextExtractor/` currently dispatches to `pdfParser.ts` and `docxParser.ts` based on MIME type. The change:

1. Remove `pdfParser.ts` and `docxParser.ts`.
2. Remove `unpdf` and related dependencies from `@webiny/api-core`.
3. Add a single `markitdownParser.ts` that calls the Python bridge for all supported formats.
4. `canExtract()` returns true for `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

### Infrastructure

- Add a new Pulumi/CDK resource for the Lambda layer in the Webiny infrastructure package.
- Attach the layer to the background task Lambda function(s).
- The layer needs to be built and published as part of the CI/CD pipeline (or pre-built and stored in S3).

## Rollout Plan

### Phase 1: Layer build and DOCX migration

1. Create the Lambda layer build script and CI pipeline.
2. Replace the custom DOCX parser with the markitdown bridge.
3. Verify DOCX output matches or improves on the current parser.
4. Deploy with DOCX only — low risk since the current parser already works.

### Phase 2: Re-enable PDF support

1. Enable PDF conversion through the same markitdown bridge.
2. Re-add `application/pdf` to the `canExtract()` supported types.
3. Update the frontend file picker to accept PDFs again.
4. Verify PDF output quality (headings, bold/italic, tables).

### Phase 3: Additional formats (optional)

1. Add PPTX, XLSX support by including the corresponding markitdown extras.
2. Update `canExtract()` and frontend file picker accept filters.

## Risks and Tradeoffs

### Latency

Each conversion spawns a Python process via `child_process`. Expected overhead: ~1-2 seconds per file. This is acceptable because:

- Conversions happen in background tasks, not in the request path.
- The LLM call itself takes 10-60 seconds, so 1-2s is negligible.

### Python runtime dependency

Lambda provides Python 3.x in the runtime, but the layer must be built for the correct architecture (x86_64 or arm64) and Python version. Since all deps are pure Python (no C extensions for PDF+DOCX), cross-platform builds are straightforward.

### Layer maintenance

The layer needs to be rebuilt when markitdown releases updates. This is a manual step unless automated in CI. markitdown is actively maintained by Microsoft.

### stdin/stdout protocol

markitdown's CLI reads from stdin and writes to stdout. If a document is very large (100+ MB), the `maxBuffer` limit on `execFile` could be hit. Mitigation: set a generous buffer limit and/or write to a temp file instead of stdin for large documents.

### Fallback

If the Python process fails (crash, timeout), the `TextExtractor` should return a clear error rather than silently dropping the file. The task runner already sends errors to the frontend via websocket.
