# Decision: how to handle authors and bylines

**Use when** the site publishes under a company name, a generic staff byline, freelancers, or many
contributors, and the user is deciding what to do about it.

## Ask first

1. Who actually wrote it, and do they exist publicly anywhere else?
2. Is this a topic where who wrote it changes whether it should be trusted?
3. Are they willing to attach real names, or is anonymity a requirement?

## Pull

```bash
python3 scripts/search_signals.py author --described --limit 20
python3 scripts/search_patents.py --mechanism author_identity --claims --limit 6
```

## The rule

`PerDocData` carries an obfuscated author identity field, and the entity subsystem resolves
documents to known entities. That means the mechanism is *identity resolution*, not *byline
presence*. A name that resolves to nothing is a string.

So the work is not adding a byline. It is making the person resolvable: the same name, consistent
across the site and off it, with a body of work attached, on a bio page that is a real page rather
than a modal.

If real names are not possible, say so plainly and stop. A fabricated author with a generated
headshot is worse than an honest company byline, because it adds a claim you cannot support.

## Output

A named policy: who gets bylined, what a bio page must contain, and how consistency is enforced
across the site and external profiles.

## Do not

Add "written by Editorial Team" and call it E-E-A-T work.
