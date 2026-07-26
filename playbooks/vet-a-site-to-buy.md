# Decision: is this site worth buying

**Use when** the user is evaluating a website acquisition, or considering an expired or aged domain.

## Ask first

1. What is the traffic history, and does the seller provide Search Console access or only analytics
   screenshots?
2. What is the content: original, spun, AI-generated, or scraped?
3. What does the link profile look like, and was any of it paid for?
4. Has the domain changed hands or changed topic before?

## Pull

```bash
python3 scripts/search_signals.py hostAge --described
python3 scripts/search_signals.py exactMatchDomain --described
python3 scripts/search_signals.py --stage 8 --described --limit 40
```

## The rule

Look for the things that survive a sale, because those are the ones you are actually buying.

- **Host age travels with the domain.** `PerDocData.hostAge` is "the earliest firstseen date of all
  pages in this host/domain. These data are used in twiddler to sandbox fresh spam in serving time."
  An aged domain has a real property a new one does not. This is the legitimate case for buying
  aged, and also why the aged domain market exists.
- **Demotions that attach to the domain do not disappear at closing.** Exact match domain demotion
  is domain-level and permanent for that domain. If the domain is a keyword string, that is priced
  in whether the seller mentions it or not.
- **Site-level quality is inherited.** You are buying the whole content distribution, not the good
  pages. Assume you have to delete a third of it.
- **A topic change resets relevance while keeping any accumulated liabilities.** The worst
  combination.

## Output

A go, go-at-a-lower-price, or walk, with the specific liabilities named and the cleanup cost
estimated in pages rather than dollars.

## Do not

Value the site on its traffic graph. The graph is the seller's exhibit. The content and link profile
are the asset.
