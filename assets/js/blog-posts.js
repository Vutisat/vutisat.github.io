/* ---------------------------------------------------------------------------
   The notebook — the list of posts behind blog.html and post.html

   To publish a post:
     1. Write it in Markdown as posts/<slug>.md
     2. Add one entry below (newest first is not required; the index sorts)
     3. That's it. No build step. It shows up on blog.html, and reads at
        post.html?p=<slug>

   Each entry:
     slug     the file name in posts/, without .md (letters, numbers, dashes)
     title    the post title
     date     "YYYY-MM-DD"
     place    where it was written (stamped on the cover)
     summary  one or two sentences for the index
     cover    "kraft" | "blue" | "red" | "green"   (the memo book's colour)
     draft    true to hide it from the index (still readable by its link)

   SAMPLE POSTS. The three below are placeholders. "how-this-blog-works" is
   worth keeping until you've written your first real post.
--------------------------------------------------------------------------- */
window.POSTS = [
  { slug: "how-this-blog-works", title: "How this notebook works", date: "2026-10-30", place: "New York",
    summary: "Sample post: write a Markdown file, add one line to a list, and it's published. Everything this notebook can do, in one page.",
    cover: "kraft" },
  { slug: "a-first-entry", title: "A first entry", date: "2026-10-12", place: "New York",
    summary: "Sample post: a short opening entry, standing in until the real first one is written.",
    cover: "blue" },
  { slug: "notes-from-a-long-layover", title: "Notes from a long layover", date: "2026-09-03", place: "Doha",
    summary: "Sample post: what a travel entry could look like, with a margin note and a list.",
    cover: "red" }
];
