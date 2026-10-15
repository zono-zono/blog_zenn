// articles/*.md の frontmatter から記事一覧を作り、README.md のマーカー間を書き換える。
// 使い方: npm run readme
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const START = "<!-- ARTICLES:START -->";
const END = "<!-- ARTICLES:END -->";

const parseFrontmatter = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, raw] = kv;
    data[key] = raw.startsWith("[") ? JSON.parse(raw) : raw.replace(/^"(.*)"$/, "$1");
  }
  return data;
};

// git に初めて追加された日。未コミットの記事は空欄。
const addedDate = (path) => {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--follow", "--format=%as", "--", path], { encoding: "utf8" });
    return out.trim().split("\n").pop() ?? "";
  } catch {
    return "";
  }
};

const articles = readdirSync("articles")
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const path = `articles/${f}`;
    const fm = parseFrontmatter(readFileSync(path, "utf8"));
    return { path, date: addedDate(path), ...fm };
  })
  .sort((a, b) => (b.date || "9999").localeCompare(a.date || "9999") || a.title.localeCompare(b.title));

const rows = articles.map((a) => {
  const status = a.published === "true" ? "公開" : "下書き";
  const type = a.type === "idea" ? "💡 アイデア" : "🛠 技術";
  const topics = (a.topics ?? []).map((t) => `\`${t}\``).join(" ");
  return `| ${a.date || "-"} | ${a.emoji ?? ""} [${a.title}](${a.path}) | ${type} | ${topics} | ${status} |`;
});

const published = articles.filter((a) => a.published === "true").length;
const table = [
  `公開 ${published} 本、下書き ${articles.length - published} 本です。`,
  "",
  "| 追加日 | タイトル | 種類 | トピック | 状態 |",
  "|---|---|---|---|---|",
  ...rows,
].join("\n");

const readme = readFileSync("README.md", "utf8");
const pattern = new RegExp(`${START}[\\s\\S]*?${END}`);
if (!pattern.test(readme)) throw new Error(`README.md に ${START} 〜 ${END} がありません`);
writeFileSync("README.md", readme.replace(pattern, `${START}\n${table}\n${END}`));
console.log(`README.md を更新しました（${articles.length} 本）`);
