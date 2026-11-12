# Content Workshop — drafting the actual cards

You write the words; this sheet just makes it easier to get to a complete, balanced
set. Fill it in plain text, then move each entry into `content/cards/` with
`npm run content:new`. Nothing here is prescriptive: strike anything that isn't you.

## 1. Who is reading, and what should they walk away with?

Write three sentences the store owner should be able to say about you after five
minutes with the box. Every card should serve at least one of them.

1. ______________________________________________
2. ______________________________________________
3. ______________________________________________

## 2. Packs (chapters) — pick 3 to 5

Suggested set; rename freely. Each pack is one shelf item and one binder group.

| Pack id | Working name (EN / NL) | What goes in | Tint | Default kind | Target # |
|---|---|---|---|---|---|
| `personality` | Personality / Karakter | Traits, how you are with people, humour, patience | 1 | trait | 6–8 |
| `craft` | Craft / Vak | What you can actually do: software, systems, teaching, organising | 2 | skill | 5–7 |
| `table` | At the table / Aan tafel | Games you host, DM'ing, what you'd recommend, how you demo | 3 | table | 5–7 |
| `track-record` | Track record / Staat van dienst | Short experience cards: roles, things you built or ran | 4 | experience | 3–5 |
| *(optional)* `quirks` | Fine print / Kleine lettertjes | The honest flaws and the odd facts; one or two rare ones | 5 | trait | 3–4 |

Aim for **20–28 cards** total. Fewer than 16 feels thin; more than 30 tests patience.

Reveal order inside a pack is yours: open with an easy one, put the rare in slot 3 or
4 (not last — the last should be a warm, simple card so the pack ends calmly).

## 3. Rarity — what it means

| Rarity | Share | Use it for |
|---|---|---|
| common | ~55 % | True, concrete, unglamorous. The backbone. |
| uncommon | ~25 % | A trait with a twist or an unusually strong skill. |
| rare | ~15 % | The three or four things that make you *you*. One per pack at most. |
| holo | 1–2 total | The thing you want remembered. Plus the contact card. |

## 4. Card drafting grid

For each card. Keep flavour ≤ 120 characters and dry; put the proof in the body.

```
id:        
pack:      
kind:      trait | skill | experience | table
rarity:    
title EN:                         title NL:
flavour EN:
flavour NL:
body EN:  (what it looks like in practice + one concrete example)

body NL:

stats (≤4, 0–10):   label EN / NL : value
tags (≤3):
art idea:  (even "none, placeholder is fine")
```

## 5. Prompts to mine for cards

Answer quickly; each answer is a candidate card.

**Personality**
- What do friends ask you to do at a game night that nobody else does?
- The last time you explained a rule to someone who was lost — what did you do?
- What do you do when a game is going badly for someone at the table?
- Which of your habits would a shop colleague notice in the first week?
- What's a thing people assume about you that's wrong?

**Craft**
- Three things you built that a non-developer would understand in one sentence.
- A time you organised something (event, campaign, process) and it ran smoothly.
- What are you fast at? What are you careful at?
- Languages (human) you speak and at what level — a shop sells to tourists too.
- Anything retail-adjacent: cash handling, inventory, customer-facing, demoing.

**At the table**
- Games you can teach from memory, by weight class (gateway / mid / heavy).
- The campaign you run: how long, how many players, what makes it work.
- A game you'd put in a nervous first-timer's hands, and why.
- A game you'd steer someone away from, and why — honesty sells.
- What you'd want a shop's demo table to feel like.

**Track record**
- Roles, in one line each: where, how long, what you were trusted with.
- Something you were told you did well. Quote it if you can.

**Fine print** (optional, humanising)
- The flaw you'd admit in an interview and what you do about it.
- An odd skill or fact.

## 6. Stats — a shared vocabulary

Pick 6–8 stat labels and reuse them across cards so they feel like one system.
Candidates: Patience · Clarity · Rules memory · Stamina (long sessions) · Curiosity ·
Follow-through · Calm under pressure · Dutch · English · Tidiness.
Not every card needs stats; traits usually do, experience cards usually don't.

## 7. The contact card (kind `contact`, rarity `holo`)

- Title: your name.
- Flavour: the one-line ask, e.g. *"Looking for a spot behind the counter and at the demo
  table."*
- Body: availability (days/hours), how you'd like to be contacted, and one sentence on
  why this shop in particular.
- Links: email (mailto), LinkedIn or site, phone if you want.

## 8. Copy voice checklist

- Short sentences. Concrete nouns. One example beats three adjectives.
- Humour by understatement, never by exclamation marks.
- NL is not a translation of EN — write both as if native; they may differ in jokes.
- No buzzwords ("passionate", "team player", "gepassioneerd"). Show it instead.
- Read every flavour line out loud. If you wouldn't say it at the counter, cut it.
