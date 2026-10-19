// LanceDB spike: one tenant+model table written the way a DynamoDB stream handler would
// (one upsert per entry), queried with the shapes the CMS list API needs.
// Usage: node bench.mjs <uri> [writes]   e.g. node bench.mjs ./data 2000 | node bench.mjs s3://bucket/x 500
import * as lancedb from "@lancedb/lancedb";
import { Schema, Field, Utf8, Float64, Int64, Bool, List } from "apache-arrow";

const uri = process.argv[2] ?? "./data";
const writes = Number(process.argv[3] ?? 2000);
const table = `t${Date.now()}_article`;

const schema = new Schema([
  new Field("id", new Utf8(), false),
  new Field("tenant", new Utf8(), false),
  new Field("status", new Utf8(), false),
  new Field("latest", new Bool(), false),
  new Field("deleted", new Bool(), false),
  new Field("folderId", new Utf8(), false),
  new Field("title", new Utf8(), false),
  new Field("price", new Float64(), true),
  new Field("publishedOn", new Int64(), true),
  new Field("tags", new List(new Field("item", new Utf8(), true)), true),
  new Field("body", new Utf8(), true)
]);

const words = [
  "alpha",
  "bravo",
  "charlie",
  "delta",
  "echo",
  "foxtrot",
  "golf",
  "hotel",
  "india",
  "juliet"
];
const pick = a => a[Math.floor(Math.random() * a.length)];
const row = i => ({
  id: `e${String(i).padStart(6, "0")}`,
  tenant: "acme",
  status: pick(["draft", "published", "unpublished"]),
  latest: true,
  deleted: Math.random() < 0.05,
  folderId: `f${i % 20}`,
  title: `${pick(words)} ${pick(words)} ${i}`,
  price: Math.round(Math.random() * 10000) / 100,
  publishedOn: BigInt(1700000000000 + i * 60000),
  tags: [pick(words), pick(words)],
  body: Array.from({ length: 40 }, () => pick(words)).join(" ")
});

const pct = (xs, p) => xs.slice().sort((a, b) => a - b)[Math.floor((xs.length - 1) * p)];
const time = async fn => {
  const t = performance.now();
  const r = await fn();
  return [performance.now() - t, r];
};

const queries = {
  "filter+sort+limit": t =>
    t
      .query()
      .where("status = 'published' AND latest AND NOT deleted")
      .orderBy({ columnName: "publishedOn", ascending: false })
      .limit(50)
      .toArray(),
  "cursor page": t =>
    t
      .query()
      .where(
        "latest AND (publishedOn < 1700060000000 OR (publishedOn = 1700060000000 AND id < 'e001000'))"
      )
      .orderBy([
        { columnName: "publishedOn", ascending: false },
        { columnName: "id", ascending: false }
      ])
      .limit(50)
      .toArray(),
  contains: t => t.query().where("title LIKE '%echo%'").limit(50).toArray(),
  startsWith: t => t.query().where("title LIKE 'echo%'").limit(50).toArray(),
  "range+in": t =>
    t.query().where("price BETWEEN 10 AND 50 AND folderId IN ('f1','f2','f3')").limit(50).toArray(),
  "tags any": t => t.query().where("array_has_any(tags, ['golf','hotel'])").limit(50).toArray(),
  count: t => t.countRows("status = 'published' AND NOT deleted"),
  fts: t => t.query().fullTextSearch("echo delta").limit(50).toArray()
};

const runQueries = async (label, fresh) => {
  const out = {};
  for (const [name, q] of Object.entries(queries)) {
    try {
      // A fresh connection per query approximates a cold Lambda: nothing cached.
      const t = fresh ? await (await lancedb.connect(uri)).openTable(table) : tbl;
      const samples = [];
      for (let i = 0; i < (fresh ? 3 : 10); i++) samples.push((await time(() => q(t)))[0]);
      out[name] = `p50 ${pct(samples, 0.5).toFixed(0)}ms`;
    } catch (e) {
      out[name] = `ERR ${String(e.message).split("\n")[0].slice(0, 90)}`;
    }
  }
  console.log(`\n## ${label}`);
  console.table(out);
};

const db = await lancedb.connect(uri);
const tbl = await db.createEmptyTable(table, schema);

const writeTimes = [];
for (let i = 0; i < writes; i++) {
  const [ms] = await time(() =>
    tbl
      .mergeInsert("id")
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute([row(i)])
  );
  writeTimes.push(ms);
}
// Re-save 10% of entries, as edits would.
for (let i = 0; i < writes / 10; i++) {
  await tbl
    .mergeInsert("id")
    .whenMatchedUpdateAll()
    .whenNotMatchedInsertAll()
    .execute([row(i)]);
}
const stats = await tbl.stats();
console.log(`uri=${uri} writes=${writes}`);
console.log(
  `single upsert: p50 ${pct(writeTimes, 0.5).toFixed(0)}ms p95 ${pct(writeTimes, 0.95).toFixed(0)}ms`
);
console.log(
  `after writes: version ${await tbl.version()}, fragments ${stats.fragmentStats.numFragments}, rows ${stats.numRows}`
);

await runQueries("before compaction, no indexes (warm)", false);

const [optMs] = await time(() => tbl.optimize({ cleanupOlderThan: new Date() }));
const s2 = await tbl.stats();
console.log(`\noptimize: ${optMs.toFixed(0)}ms -> fragments ${s2.fragmentStats.numFragments}`);

const [idxMs] = await time(async () => {
  await tbl.createIndex("status", { config: lancedb.Index.bitmap() });
  await tbl.createIndex("folderId", { config: lancedb.Index.bitmap() });
  await tbl.createIndex("publishedOn", { config: lancedb.Index.btree() });
  await tbl.createIndex("price", { config: lancedb.Index.btree() });
  await tbl.createIndex("tags", { config: lancedb.Index.labelList() });
  await tbl.createIndex("body", { config: lancedb.Index.fts() });
});
console.log(`indexes: ${idxMs.toFixed(0)}ms`);

// Sanity check that the sorted, filtered query returns what the CMS would expect.
const sorted = await queries["filter+sort+limit"](tbl);
const ok =
  sorted.length === 50 &&
  sorted.every(r => r.status === "published" && !r.deleted) &&
  sorted.every((r, i) => i === 0 || sorted[i - 1].publishedOn >= r.publishedOn);
const total = await tbl.countRows("status = 'published' AND NOT deleted");
const ftsHits = (await queries.fts(tbl)).length;
console.log(`sanity: sorted+filtered ok=${ok}, published count=${total}, fts hits=${ftsHits}`);

await runQueries("compacted + indexed (warm)", false);
await runQueries("compacted + indexed (cold connection)", true);

// Writes after indexing land in unindexed fragments until the next optimize.
for (let i = writes; i < writes + 100; i++) {
  await tbl
    .mergeInsert("id")
    .whenMatchedUpdateAll()
    .whenNotMatchedInsertAll()
    .execute([row(i)]);
}
await runQueries("100 writes after indexing, before optimize (warm)", false);

await db.dropTable(table);
