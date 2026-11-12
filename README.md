# Remote jobs scraper: examples in Python, Node.js and cURL for Remote OK, We Work Remotely and more

Working examples for collecting remote job postings from seven public job boards (Remote OK, We Work Remotely, Remotive, Jobicy, 4dayweek.io, Remote First Jobs and Arbeitnow) as one deduplicated dataset, using the [Remote Jobs Scraper Actor](https://apify.com/cedarfetch/remote-jobs-scraper) on Apify. Each board is read through its official public API or RSS feed and normalised to one schema, with location restrictions parsed into countries and regions and salary estimated in USD per year.

The scripts call the Actor from code with the official Apify API client. If you would rather not use a paid tool, the last section names the public feeds it reads, so you can fetch them yourself.

## Quick start

You need an Apify API token (Integrations page in Apify Console, https://console.apify.com/account/integrations). Apify's free plan includes monthly platform credit, which is enough to try this.

**Python** (3.11 or newer, required by `apify-client` 3.x):

```bash
cd examples/python
pip install -r requirements.txt
export APIFY_TOKEN=your_token_here      # Windows cmd: set APIFY_TOKEN=your_token_here
python 01_run_and_print.py
```

On Windows, run `set PYTHONUTF8=1` first if the console fails on non-ASCII job titles.

**Node.js** (18 or newer):

```bash
cd examples/node
npm install
export APIFY_TOKEN=your_token_here
node 01-run-and-print.mjs
```

**cURL** (no install, one HTTP call):

```bash
export APIFY_TOKEN=your_token_here
bash examples/curl/run.sh
```

The first example reads three boards and takes about 20 seconds (We Work Remotely is read in 11 category feeds, one request per second). A run over two boards takes a few seconds. A run over all seven boards takes about five minutes, because 4dayweek.io alone is roughly 100 polite requests. Real rows are in [`sample-output/sample.json`](sample-output/sample.json).

## What is in this repository

| Path | What it does |
|---|---|
| `examples/python/01_run_and_print.py` | Run the Actor on three boards, print one line per job. |
| `examples/python/02_jobs_to_csv.py` | Write jobs to a CSV file, filtered by category, location and minimum pay. |
| `examples/python/03_daily_new_jobs.py` | Print only the jobs that are new since the last run, as Markdown list items with the source board named. |
| `examples/node/01-run-and-print.mjs`, `02-jobs-to-csv.mjs`, `03-daily-new-jobs.mjs` | The same three scripts as ES modules. |
| `examples/curl/run.sh`, `input.json` | One-call version using the `run-sync-get-dataset-items` endpoint. |
| `sample-output/sample.json` | 9 real job rows, three each from Jobicy, We Work Remotely and Remote OK, shortened (see below). |

The token is always read from the `APIFY_TOKEN` environment variable. Nothing is hard-coded.

## Input options

Everything is optional. With no input you get every listed remote job from all seven boards, deduplicated, newest first. The options used most often:

| Field | Default | What it does |
|---|---|---|
| `sources` | all seven | Boards to read: `remoteok`, `weworkremotely`, `remotive`, `jobicy`, `fourdayweek`, `remotefirstjobs`, `arbeitnow`. |
| `maxJobs` | 0 (all) | Stop after this many delivered jobs (newest first, after filters and dedupe). |
| `maxJobsPerSource` | 0 (all) | Stop reading a board after this many matching jobs. Such a board reports no removals in that run. |
| `titleKeywords` | none | Keep titles containing any (or all, with `titleKeywordsMode: "all"`) of these words. `engineer*` matches by prefix. |
| `excludeTitleKeywords` | none | Drop titles containing any of these words. |
| `searchDescription` | false | Apply both keyword lists to the description too. |
| `categories` | none | `engineering`, `design`, `product`, `marketing`, `sales`, `support`, `data`, `devops`, `finance`, `hr`, `writing`, `other`. |
| `locationsAllowed` | none | Where you can work from: `worldwide`, a region, or a country. Jobs with an unreadable restriction are dropped unless `includeUnknownLocations` is on. |
| `employmentTypes` | none | `full_time`, `part_time`, `contract`, `temporary`, `internship`, `apprenticeship`, `volunteer`, `other`. |
| `minSalaryUsd` | 0 (off) | Minimum estimated USD per year (top of the published range). Jobs without pay are dropped unless `includeJobsWithoutSalary` is on. |
| `postedAfter` | none | ISO date (`2026-11-01`) or relative value (`24 hours`, `7 days`, `2 weeks`). |
| `dedupe` | true | Merge cross-posted copies into one row (`alsoOn`). |
| `includeDescription` | true | Include the description. |
| `descriptionFormat` | `text` | `text`, `html`, `markdown` or `all`. |
| `trackChanges` | false | Label rows `new`, `updated`, `unchanged` or `removed` against the previous run with the same boards and filters. |
| `changesOnly` | false | With tracking on, deliver only the change types in `changeTypes`. |
| `changeTypes` | `new`, `updated`, `removed` | Which changes `changesOnly` delivers. |
| `snapshotStoreName` | `remote-jobs-scraper-snapshots` | Named key-value store for snapshots. Use different names for independent feeds. |

## Output

One row per job in the default dataset, newest first. `recordType` is `job`, or `source_status` for a board that could not be read (free). One row from [`sample-output/sample.json`](sample-output/sample.json), shortened:

```json
{
    "recordType": "job",
    "source": "jobicy",
    "sourceJobId": "161451",
    "jobId": "jobicy:161451",
    "alsoOn": [],
    "title": "Mid/Senior Talent Acquisition Specialist (Remote - Italy)",
    "companyName": "EverAI",
    "category": "hr",
    "categoryRaw": "HR & Recruiting",
    "tags": [],
    "employmentType": "contract",
    "isRemote": true,
    "location": "Italy",
    "regions": [
        "europe",
        "eu",
        "emea"
    ],
    "countries": [
        "IT"
    ],
    "isWorldwide": false,
    "compensation": {
        "min": 50000,
        "max": 85000,
        "currency": "EUR",
        "interval": "year",
        "text": null
    },
    "salaryUsdAnnualMin": 55635,
    "salaryUsdAnnualMax": 94580,
    "postedAt": "2026-11-11T18:56:57.000Z",
    "jobUrl": "https://jobicy.com/jobs/161451-mid-senior-talent-acquisition-specialist-remote-italy",
    "applyUrl": "https://jobicy.com/jobs/161451-mid-senior-talent-acquisition-specialist-remote-italy",
    "sourceAttribution": "Job from Jobicy (https://jobicy.com). Jobicy API terms: credit Jobicy as the source, keep apply links pointing to the Jobicy job page (this jobUrl), do not pres...",
    "dataOrigin": "api",
    "scrapedAt": "2026-11-12T00:55:17.372Z"
}
```

The sample file comes from running the Actor itself against three boards on 2026-11-11 (three jobs per board) and keeps every field of each row. Only length was cut: long text is truncated with `...` and lists show their first few entries.

`alsoOn` lists the other boards that carry the same job. `regions`, `countries` and `isWorldwide` are parsed from the board's free-text restriction; `isWorldwide` is `null` when nothing could be read (an empty restriction, "Remote", or only a city). `salaryUsdAnnualMin` and `salaryUsdAnnualMax` use fixed exchange rates and full-time hours, so treat them as filters, not offers. `dataOrigin` is `api` (read in this run), `cache` (reused to respect a board's polling limit) or `snapshot` (a removed row).

With change tracking on, rows also carry `changeType`, `changedFields`, `previous`, `firstSeenAt`, `removedAt` and `removedReason`.

## Recipes

**Daily new remote jobs.** [`03_daily_new_jobs.py`](examples/python/03_daily_new_jobs.py) runs with `trackChanges`, `changesOnly` and `changeTypes: ["new"]` and prints Markdown list items you can paste into a newsletter or post to a chat. The first run labels every job `new` because it creates the baseline. Schedule the same input daily in Apify Console and you pay only for the new jobs.

**Engineering jobs open to people in Europe, paying at least $90,000.** `categories: ["engineering", "devops", "data"]`, `locationsAllowed: ["europe"]`, `minSalaryUsd: 90000`, `postedAfter: "14 days"`. [`02_jobs_to_csv.py`](examples/python/02_jobs_to_csv.py) takes the same filters on the command line: `python 02_jobs_to_csv.py jobs.csv engineering,data europe 90000`. A German resident matches `EMEA` and `Europe` jobs, and a job open worldwide always matches.

**Keyword search across two boards.** `sources: ["weworkremotely", "remotive"]`, `titleKeywords: ["react", "typescript"]`, `searchDescription: true`, `excludeTitleKeywords: ["intern"]`, `maxJobs: 100`.

**One feed of jobs and where they are also posted.** Leave `dedupe` on and read `alsoOn` to see which other boards list the same job. Two records are merged only when company, title, location restriction, dates and apply hosts all agree, so merges are conservative.

## Pricing

The Actor uses pay-per-event pricing. Prices shown on the [Apify listing](https://apify.com/cedarfetch/remote-jobs-scraper) when this repository was written (2026-11-11):

- Job row: $0.0015 each (from $1.50 per 1,000 jobs), `removed` rows included.
- Actor start: $0.00005 per GB of run memory, minimum one event.
- Board status rows are free. With `changesOnly`, unchanged jobs are not delivered and not charged.

Apify's free plan includes monthly platform credit that you can use to try the Actor. Prices can change, so check the Pricing tab of the listing before you schedule anything. Set Maximum cost per run in the run options, or `maxTotalChargeUsd` in the API client, to cap spending.

## Limits and honest caveats

- These are the boards' public feeds, not their full websites. Remote OK exposes its latest ~100 jobs, Jobicy the last 7 days, Remote First Jobs the newest 500, and Arbeitnow is read up to 8 pages. Remotive and Remote First Jobs publish with a 24-hour delay, Jobicy with 3 hours, 4dayweek.io up to 48 hours. Remotive's public feed is small (13 jobs on 2026-11-11).
- **If you republish the jobs, follow the terms of the board each job came from**: link to `jobUrl`, name the board, and do not forward Remotive or Remote First Jobs listings to Google Jobs, LinkedIn Jobs or Jooble. Every row carries its board's terms in one sentence (`sourceAttribution`). Remote OK, for example, asks for a followed link back and no use of its logo.
- Polling limits are enforced per Apify account: if you run the Actor again within a board's window (Remotive about 4 calls a day, Jobicy once an hour), that board's answer from your previous run is reused (`dataOrigin: "cache"`).
- Location text is free text. Anything the parser cannot read stays in `location` with `isWorldwide: null`.
- Categories for Remote OK and Arbeitnow, and for vague board labels, are classified from the job title, and a few will be wrong.
- Salary USD estimates use fixed exchange rates and full-time hours.
- Arbeitnow is a Europe-focused board, many of its postings are in German, and its location is often a city. It is always read partially, so it never reports removals.
- If a board blocks or rate-limits requests, it is reported as a free status row and the other boards are still delivered. The run fails only when every selected board failed.
- Not included, on purpose: Himalayas (its API terms forbid passing the jobs to third parties), Working Nomads, The Muse, Real Work From Anywhere, NoDesk, Jobspresso, JustRemote, Remote.co, LinkedIn and Indeed (no usable public feed, no reuse terms, or bot protection that this Actor does not bypass).
- The Actor reads job postings only. It does not collect anything about applicants or other people.
- The sync endpoint used by `run.sh` answers 408 after 300 seconds. A run over all boards can exceed that, so use the Python or Node examples for it, or limit `sources`.
- You are responsible for how you use the data and for each source's terms.

## Do it yourself (no paid tool)

Each board publishes a free feed. The Actor reads these:

| Board | Endpoint | Terms in short |
|---|---|---|
| Remote OK | `GET https://remoteok.com/api` (latest ~100 jobs; element 0 of the answer is a legal notice) | Followed link back to the job, name Remote OK as the source, do not use its logo. |
| We Work Remotely | RSS: `https://weworkremotely.com/remote-jobs.rss` (newest 100) and 11 feeds like `https://weworkremotely.com/categories/remote-programming-jobs.rss` | Attribute the job links back to We Work Remotely. |
| Remotive | `GET https://remotive.com/api/remote-jobs` | Link back and name Remotive; do not submit its jobs to third-party job sites; about 4 calls a day. |
| Jobicy | `GET https://jobicy.com/api/jobs?count=100` | Credit Jobicy, keep apply links on its job page; no more than once an hour. |
| 4dayweek.io | `GET https://4dayweek.io/api/v2/jobs?work_arrangement=remote&limit=100&page=1` | Link back and credit; 60 requests a minute. |
| Remote First Jobs | `GET https://remotefirstjobs.com/api/search-jobs?page=0` (pages 0 to 4) | Credit and link; do not submit to LinkedIn Jobs, Google Jobs or Jooble. |
| Arbeitnow | `GET https://www.arbeitnow.com/api/job-board-api?page=1` | Free public API, link back, do not abuse. |

The terms column is a summary from the board's own pages as read on 2026-11-11. Read the originals before you reuse the data. A minimal Python version for three of them, standard library only:

```python
import json
import urllib.request
import xml.etree.ElementTree as ET


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "job-reader/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


# Remote OK: element 0 is a legal notice, jobs start at element 1.
for job in json.loads(fetch("https://remoteok.com/api"))[1:6]:
    print("remoteok", job["position"], job["company"], job["url"])

# Remotive (asks for at most about 4 calls a day)
for job in json.loads(fetch("https://remotive.com/api/remote-jobs?limit=5"))["jobs"]:
    print("remotive", job["title"], job["company_name"], job["url"])

# We Work Remotely (RSS)
feed = ET.fromstring(fetch("https://weworkremotely.com/remote-jobs.rss"))
for item in feed.findall("./channel/item")[:5]:
    print("wwr", item.findtext("title"), item.findtext("link"))
```

What the paid Actor adds on top: all seven boards in one schema, cross-board deduplication, parsed countries and regions, salary estimates in USD, polling-limit handling, attribution text on every row, and the snapshot comparison behind `changeType`. If you only need one board, the feeds above are enough.

## Related

Other example repositories from Cedarfetch Labs:

- [shopify-store-scraper-examples](https://github.com/cedarfetch/shopify-store-scraper-examples): Shopify product, price and stock data
- [ats-jobs-scraper-examples](https://github.com/cedarfetch/ats-jobs-scraper-examples): Greenhouse, Lever, Ashby and other applicant-tracking-system job boards
- [substack-scraper-examples](https://github.com/cedarfetch/substack-scraper-examples): Substack newsletter posts as Markdown
- [google-trending-searches-examples](https://github.com/cedarfetch/google-trending-searches-examples): what is trending on Google right now, per country

Listing: https://apify.com/cedarfetch/remote-jobs-scraper

Not affiliated with Remote OK, We Work Remotely, Remotive, Jobicy, 4dayweek.io, Remote First Jobs or Arbeitnow.

Maintained by Cedarfetch Labs, the developer of this Actor.
