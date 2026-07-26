# Workflow: Build a content brief from the mechanisms

Standard content briefs are keyword lists with a word count attached. This one is
built backwards from what the pipeline can actually read.

## Inputs

- Target query, or the job the page must do.
- Who is going to read it, and what they do next if it works.
- Whether this competes on freshness, depth, authority, or all three. Ask if unclear.
  This decides which stages matter.

## Step 1: Classify the query intent first

Stage 9 decides what kind of result the query deserves before any page-level signal
is consulted. Get this wrong and the rest of the brief is wasted.

```bash
python3 scripts/search_patents.py "query intent" --claims --limit 5
python3 scripts/search_signals.py --stage 9 --described --limit 30
```

Look at what actually ranks now. If the SERP is all tools, a 3,000 word essay loses
no matter how good it is. If the SERP is all forums, the query wants opinion, not
authority. The pipeline is telling you what it decided. Read it.

Note whether the query looks informational-quick or informational-slow. Expected
dwell time differs, and stage 5 weights clicks against that expectation. A padded
page on a quick-answer query produces bad clicks, not good ones.

## Step 2: Pull the mechanisms for the stages that matter

For a depth and authority play:

```bash
python3 scripts/search_patents.py --mechanism quality_scoring --claims --limit 10
python3 scripts/search_patents.py --mechanism entity_knowledge_graph --claims --limit 10
```

For a freshness play:

```bash
python3 scripts/search_patents.py --mechanism freshness_temporal --claims --limit 10
```

Read the claims. They describe what the models look for. That is your brief's spine.

## Step 3: Turn each mechanism into a content requirement

Never write "include the keyword." Write the behavior.

| Mechanism found in the patents | Content requirement |
|---|---|
| Original content scoring rewards material not found elsewhere | One original element per page: own data, own test, own photograph, own interview |
| Entity resolution binds documents to known entities | Name real entities explicitly. People, products, organizations, places. Link them to their canonical references |
| Passage-level extraction scores sections independently | Each section must stand alone and answer one thing completely |
| Relevance is the ratio of long views to total views | Deliver the answer before the reader can bounce, then earn the rest of the read |
| Freshness signals key on significant update, not any edit | Plan the update cadence and what a real update will contain, at brief time |

## Step 4: Specify what the page must produce, not contain

The brief output is a list of producible things. Every line should be checkable by
looking at the finished page.

```
MUST PRODUCE
- A named author with a resolvable identity, bylined, linked to their body of work
- A visible publish date and a real last-updated date policy
- One original dataset, test, or first-hand account nobody else has
- Named entities: at least the products, organizations and people the topic requires
- A first screen that answers the query outright
- Section headings that each map to one sub-question from the SERP
- Structured data appropriate to the type

MUST NOT
- Padding to hit a word count. Bad clicks on quick-answer queries cost more than
  thin content on slow ones
- Fabricated freshness. A date change with no substantive edit is a pattern the
  freshness system is built to catch
- Entity name-dropping without substance
```

## Step 5: Say what would falsify the brief

One line. "If this ranks nowhere in eight weeks despite producing all of the above,
the constraint is site-level authority, not this page." That line is what separates a
brief from a wish list, and it tells you what to test next.

## Rules

- Cite the patent for any mechanism you assert.
- Do not include a word count unless the SERP evidence supports one. Length is not a
  signal; completeness relative to intent is.
- Do not promise ranking. The brief controls the page, not the competition.

---

**Related playbooks.** `playbooks/ai-content-risk.md` if the draft will be model-assisted, `playbooks/featured-snippets.md` if the query shows one, `playbooks/ecommerce-product-pages.md` for commercial pages, `playbooks/ymyl-sites.md` if the topic carries risk.
