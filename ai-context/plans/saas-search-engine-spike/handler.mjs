// Lambda entry for the LanceDB spike.
//   {mode:"bench", uri, writes}  same run as bench.mjs on EC2
//   {mode:"setup", uri, rows}    bulk-loads one compacted, indexed table and keeps it
//   {mode:"query", uri}          opens that table from scratch and times each query once
const loadStart = performance.now();
const lancedb = await import("@lancedb/lancedb");
const moduleLoadMs = performance.now() - loadStart;

const TABLE = "kept_article";
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
  publishedOn: 1700000000000 + i * 60000,
  tags: [pick(words), pick(words)],
  body: Array.from({ length: 40 }, () => pick(words)).join(" ")
});

const queries = {
  "filter+sort+limit": t =>
    t
      .query()
      .where("status = 'published' AND latest AND NOT deleted")
      .orderBy({ columnName: "publishedOn", ascending: false })
      .limit(50)
      .toArray(),
  contains: t => t.query().where("title LIKE '%echo%'").limit(50).toArray(),
  "range+in": t =>
    t.query().where("price BETWEEN 10 AND 50 AND folderId IN ('f1','f2','f3')").limit(50).toArray(),
  count: t => t.countRows("status = 'published' AND NOT deleted"),
  fts: t => t.query().fullTextSearch("echo delta").limit(50).toArray()
};

const time = async fn => {
  const t = performance.now();
  await fn();
  return Math.round(performance.now() - t);
};

export const handler = async event => {
  if (event.mode === "bench") {
    const lines = [];
    const orig = { log: console.log, table: console.table };
    console.log = (...a) => lines.push(a.join(" "));
    console.table = o =>
      lines.push(
        Object.entries(o)
          .map(([k, v]) => `  ${k.padEnd(18)} ${v}`)
          .join("\n")
      );
    process.argv = ["node", "bench.mjs", event.uri, String(event.writes)];
    try {
      await import(`./bench.mjs?${Date.now()}`);
    } finally {
      Object.assign(console, orig);
    }
    return lines.join("\n");
  }

  if (event.mode === "setup") {
    const db = await lancedb.connect(event.uri);
    const rows = Array.from({ length: event.rows }, (_, i) => row(i));
    const tbl = await db.createTable(TABLE, rows, { mode: "overwrite" });
    await tbl.createIndex("status", { config: lancedb.Index.bitmap() });
    await tbl.createIndex("folderId", { config: lancedb.Index.bitmap() });
    await tbl.createIndex("publishedOn", { config: lancedb.Index.btree() });
    await tbl.createIndex("price", { config: lancedb.Index.btree() });
    await tbl.createIndex("body", { config: lancedb.Index.fts() });
    return { rows: await tbl.countRows() };
  }

  if (event.mode === "query") {
    const out = { moduleLoadMs: Math.round(moduleLoadMs) };
    let tbl;
    out.connectAndOpenMs = await time(async () => {
      tbl = await (await lancedb.connect(event.uri)).openTable(TABLE);
    });
    // The first query pays for reading the manifest and index metadata from S3.
    for (const [name, q] of Object.entries(queries))
      out[`first ${name}`] = await time(() => q(tbl));
    for (const [name, q] of Object.entries(queries))
      out[`second ${name}`] = await time(() => q(tbl));
    return out;
  }

  throw new Error(`unknown mode ${event.mode}`);
};
