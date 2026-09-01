# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience is **recruiters and hiring managers** evaluating Pob Vutisalchavakul for senior/staff engineering and technical-leadership roles. Posture is open-to-actively-seeking: visitors may arrive from a referral, a LinkedIn/GitHub click, or a resume link, and the site should credibly convert an interested reader into an inbound conversation — not merely archive a résumé. Secondary readers are engineering peers and personal contacts who land on the playful hidden layer (travel recs, life list).

## Product Purpose

A personal portfolio / professional home on the web for Pob Vutisalchavakul, Staff Software Engineer based in NYC. It presents his experience, skills, and personality in one place and gives interested people a fast, low-friction way to reach out. Success means:

- **Inbound opportunities** — visitors email or message about roles/projects after visiting.
- **Credibility and memorability** — the craft of the site itself signals the quality of the engineer; visitors leave impressed and remember him.
- **Personality shows through** — the human behind the résumé (traveler, mentor, kind teammate) comes across, not just a list of jobs.

## Positioning

A senior/staff engineer who pairs deep systems experience (billing at billions of dollars, petabyte-scale data pipelines, infrastructure behind target.com — a top-60 US site) with genuine servant-leadership and an unusually global perspective (~80 countries, fluent in Thai and English). The differentiator is the combination: heavy-scale backend credibility delivered by someone whose stated first commitment is kindness and developing people.

## Operating Context

- Hosted on GitHub Pages at `vutisat.github.io`, served under the personal domains **pobv.me** and **pobv.dev**.
- Single-page primary experience (`index.html`) with sections: Hero, About, Experience (timeline), Skills, Contact. Résumé is linked as a PDF (`resume.pdf`) and an HTML variant (`resume.html`).
- A playful hidden layer exists and is a real part of the site's character: a secret nav revealing **Thailand Recs** (`thailand.html`), **NYC Recs** (`nyc.html`), and a **Life List** (`life.html`), plus other easter eggs added over time.
- Pob maintains and updates the site himself; content changes (résumé swaps, new recs) happen by hand.

## Capabilities and Constraints

- Static site: plain HTML, CSS, and JavaScript with no build step or framework; jQuery is present. New work should assume direct-edit, no-bundler deployment on GitHub Pages unless Pob decides otherwise.
- External runtime dependencies currently loaded from CDNs: Google Fonts (Inter, JetBrains Mono) and Font Awesome; social/brand imagery lives as local PNGs.
- Content is real and self-authored; career facts, employers, dates, and metrics are factual and must not be altered or embellished without Pob's confirmation.

## Brand Commitments

- **Voice: kindness and servant-leadership.** The warm, humble, people-first tone throughout the copy ("show up with kindness and thoughtfulness, in code and in life") is intentional and binding. Future copy and design must preserve this register — confident about the work, never boastful about the person.
- Identity: "Pob Vutisalchavakul," handle `pobv` (logo reads `pobv.dev`), personal domains pobv.me / pobv.dev.

## Evidence on Hand

- Real work history with concrete, verifiable metrics (billions in billing processed, ~10M daily hits at Target, petabyte-scale warehouse, 15M-user feature).
- Real assets in repo: `resume.pdf`, social banner/icon PNGs, favicon set under `icons/`, and hand-written recommendation content (`NYC_recs.txt`, `Thailand_recs.txt`).
- No third-party testimonials, quotes, or endorsements are present; future work must not fabricate any.

## Product Principles

1. **The craft is the argument.** For this audience, the quality and polish of the site itself is direct evidence of engineering taste — it must never read as templated or careless.
2. **Convert warmly, don't hard-sell.** Make reaching out effortless and inviting; the tone stays humble even while the work speaks loudly.
3. **Let personality be a feature, not noise.** The traveler/mentor/human layer (and the easter eggs) differentiates Pob from an equivalent résumé — keep it discoverable and delightful without letting it undercut credibility.
4. **Keep it self-maintainable.** Favor changes Pob can update by hand on a static host over anything that adds build complexity.
5. **Only true claims.** Every metric and credential is real; nothing gets inflated to look more impressive.
