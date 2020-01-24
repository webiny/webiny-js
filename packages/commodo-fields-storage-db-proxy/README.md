# @commodo/fields-storage-mongodb
A MongoDB driver for the [fields-storage](../fields-storage) package.

## Usage

```js
import { withStorage } from "@commodo/fields-storage";
import { MongoDbDriver, withId } from "@commodo/fields-storage-mongodb";
import { compose } from "ramda";

// Create two functions with a name assigned to them.
const User = compose(
  withId(),
  withStorage({ driver: new MongoDbDriver({ database }) })
  (...)
)(function() {});
```

## Reference

#### `withName(name: string): Function`
Creates a new function with a name assigned to it and passed to its instances.

#### `hasName(value: any): boolean`
Checks if passed value has a name assigned to it.

#### `getName(value: any): string`
Returns a name assigned to the passed value. Returns empty string if none assigned.
