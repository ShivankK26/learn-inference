import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";

export type TocItem = { id: string; text: string };

// Mirrors rehype-slug: every heading is slugged in document order with one slugger,
// so duplicate headings get the same -1, -2 suffixes. Only ## headings are listed.
export function lessonToc(slug: string): TocItem[] {
  const src = fs.readFileSync(path.join(process.cwd(), "src/content", `${slug}.mdx`), "utf8");
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of src.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2]
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_`]/g, "")
      .trim();
    const id = slugger.slug(text);
    if (m[1] === "##") items.push({ id, text: text.replace(/'/g, "’") });
  }
  return items;
}
