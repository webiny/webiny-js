## Process
- when saving the page, a URL regex has to be generated
- client sends a `GET /api/cms/pages/load?url=$url`
- try matching the given `$url` against published pages
- extract URL parameters
- load data for each relevant content block using `DataSource` (HKT logic)
- for each block data will be provided using `data` prop
- blocks that have data source set to `independent` will not have the
data loaded by the API
- once the API loads the data, the page is rendered using lazy loaded
components (module names are returned from the API) by passing the relevant
props to each component
- components that don't receive `data` should load data on their own
- EDITOR: when a widget is deleted, we need to call a delete callback on the widget for optional API calls (delete image, etc.)