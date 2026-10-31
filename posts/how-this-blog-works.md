This notebook has no build step. Every post is a plain Markdown file in the `posts/` folder, and one line in `assets/js/blog-posts.js` adds it to the index. Save both, push, and it's live.{{note: This post is a sample. Keep it as a reference until the first real post exists, then delete it or mark it as a draft.}}

## Writing a post

1. Create `posts/my-new-post.md`.
2. Add an entry to `window.POSTS` with the same slug, a title, the date and where you wrote it.
3. Open `post.html?p=my-new-post` to read it.

You don't put the title in the Markdown file; the cover and the page heading come from the list.

## What Markdown works

Paragraphs are separated by a blank line. You can use **bold**, *italic*, `inline code` and [links](home.html).

### Lists

- Bulleted lists use a dash
- Numbered lists use `1.`
- Keep each item on one line

### Quotes

> A quote is a line that starts with a greater-than sign. It's set in the notebook like something copied down from a book.

### Code

```
function hello() {
  return "a fenced block, three backticks above and below";
}
```

### Images

![Pob in a cleanroom suit and hairnet beside a cryostat setup in a lab](assets/img/lab.jpg)

Images use `![description](path/to/image.jpg)`. Put them anywhere under `assets/`.

### Margin notes

Wrap a side thought in double curly braces with `note:` at the start, and it's pinned in the margin beside the paragraph instead of interrupting it.{{note: Like this. On a phone, margin notes drop in below their paragraph.}}

---

A horizontal rule is three dashes on their own line, like the one just above.
