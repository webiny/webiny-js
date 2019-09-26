# CodeEditor

### Additional information
<a href="https://github.com/securingsincity/react-ace" target="_blank">https://github.com/securingsincity/react-ace</a>

### Description
`CodeEditor` is a wrapper around one of the most popular code editors called `Ace` editor. Have in mind that you still
have to import `brace` as a dependency (after importing `CodeEditor`) for different code formats and editor types.

### Import
```js
import brace from 'brace';
import { CodeEditor } from "@webiny/ui/CodeEditor";

// Make sure to import this after CodeEditor. Check official docs for available modes and themes.
import 'brace/mode/json';
import 'brace/theme/github';
```