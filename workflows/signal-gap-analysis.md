# Workflow: Signal gap analysis

A page audit asks "what is wrong with this page." A gap analysis asks a sharper
question: **which signals does Google have a place to store, that this page produces
nothing for?**

Empty slots beat weak values. A field with nothing in it is a fix with no competitor
bidding against you.

## Run it against one page

### 1. Pull the storable signals for the relevant stages

```bash
python3 scripts/search_signals.py --stage 3 --described --limit 50
python3 scripts/search_signals.py --stage 6 --described --limit 50
python3 scripts/search_signals.py --stage 7 --described --limit 50
```

Use only `--described` results. If Google did not document the field, you cannot say
what would fill it, and a recommendation built on a guess about an undocumented field
is exactly the folklore this skill exists to replace.

### 2. Classify each signal against the page

Three buckets.

- **Produced.** The page clearly gives Google something for this field.
- **Empty.** The page gives Google nothing. No byline, no dates, no structured data,
  no entity anchors, no original media.
- **Unknowable.** Requires data you do not have, such as click behavior or backlinks.
  Say so rather than inventing a verdict.

### 3. For each empty slot, find the mechanism

```bash
python3 scripts/search_patents.py --module RepositoryWebrefEntityJoin --claims --limit 3
```

An empty slot only matters if the patents show the field feeding something. If no
patent describes a use, log it as low priority and say why.

### 4. Rank by leverage, not effort

Order the gaps by how much of the pipeline they unlock.

Signals that feed multiple downstream stages beat signals that terminate. Entity
resolution feeds stage 6, 9, and 12. A byline feeds author signals and E-E-A-T
handling. A date feeds freshness and query deserves freshness handling. Compare that
against a field consumed by one twiddler and the ranking is obvious.

## Run it against a competitor set

The stronger version. Same classification, applied to the top five ranking pages plus
the client.

Build the matrix: signals down the side, pages across the top, produced or empty in
each cell.

What you are looking for is not "we are behind on everything." It is the row where
every ranking page produces the signal and the client does not. That row is the
hypothesis. It is the closest thing to a controlled experiment SEO offers, and it is
worth far more than a generic audit.

State it as a hypothesis, not a cause. Correlation across five pages is a lead, not a
proof.

## Output shape

```
GAP: no author entity on any article
  Storable in: RepositoryWebrefEntityJoin, PerDocData.authorObfuscatedGaiaStr
  Mechanism: US7565358B2, entity resolution binds documents to known entities
  Competitors producing it: 5 of 5
  Behavior to produce: real named authors with resolvable identities across the web,
    not a generic "Staff" byline
  Leverage: feeds stages 6, 9, 12
```

One block per gap. Ranked. No scores, no percentages, no invented weights.

## The failure mode to avoid

Do not turn this into a checklist product. The moment it becomes "here are 40 signals,
tick them off," it has been converted back into the shadow-chasing this skill argues
against. Each gap must carry its mechanism and its behavior. If you cannot state the
behavior a human should change, drop the row.

---

**Related playbooks.** `playbooks/author-strategy.md` and `playbooks/dates-on-pages.md` cover the two gaps this analysis finds most often. `playbooks/internal-linking.md` covers the third.

**One-shot lookups.** `python3 scripts/explain.py <field>` gives the field and its patents together.
