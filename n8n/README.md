# n8n workflow: new remote jobs to Google Sheets (daily)

[`new-remote-jobs-to-google-sheets.json`](new-remote-jobs-to-google-sheets.json) is an importable n8n workflow. Once a day it runs the [Remote Jobs Scraper Actor](https://apify.com/cedarfetch/remote-jobs-scraper) with change tracking on and appends **only the jobs it has not seen before** to a Google Sheet, one row per job.

```text
Schedule (daily 07:00) -> HTTP Request (Apify, new jobs only) -> Filter (job rows only) -> Code (sheet columns) -> Google Sheets (append)
```

It uses n8n core nodes only, so it imports on n8n Cloud and self-hosted n8n without installing anything. It was import-tested on n8n 2.47.5.

Columns written: Posted, Title, Company, Board, Location restriction, Worldwide, Salary (as published), Salary USD/yr (estimate), Category, Employment type, Job URL, Also on, Job ID, Source terms. **Job URL is always the board's own job page**, and Board and Source terms name where each job came from, as the boards' terms ask. Keep both if you republish the jobs.

## Setup (3 steps)

In n8n: **Workflows > Import from File** and pick the JSON file. Then:

1. **Apify token.** Open the *Run Remote Jobs Scraper* node and create a **Header Auth** credential called `Apify API token`: Name `Authorization`, Value `Bearer <your token>`. The token is on the API & Integrations page of Apify Console.
2. **Google Sheet.** Create an empty spreadsheet. Open the *Append rows to Google Sheet* node, connect your Google account, paste the spreadsheet URL over `REPLACE_WITH_YOUR_SPREADSHEET_URL` and pick the tab (the template says `Sheet1`; the first tab has another name in some languages). The first run writes the header row.
3. **What to search.** Edit the JSON body of the HTTP node. The default reads Remote OK, We Work Remotely, Remotive and Jobicy with no filters. Add any field from the [input options](../README.md#input-options), for example `"titleKeywords": ["engineer*"]`, `"locationsAllowed": ["europe"]` or `"minSalaryUsd": 90000`.

Activate the workflow. Sticky notes inside the workflow repeat these steps.

## What a run costs

Pay per event, at the prices listed in the [main README](../README.md#pricing) (2026-11-11): $0.0015 per job row and $0.00005 per GB of memory per Actor start. Only new jobs are delivered, so only new jobs are charged.

- **First run:** every current job counts as `new` (this creates the baseline), capped by `maxJobs: 100`, so at most about **$0.15**. Jobs beyond the cap are delivered on the following runs.
- **Daily after that:** only jobs posted since yesterday on the selected boards, typically a few dozen, so a few cents. Never more than 100 rows ($0.15) per run with the default input.
- `maxTotalChargeUsd=0.50` is set as a query parameter on the HTTP node, so one run can never cost more than $0.50 even if you raise `maxJobs`.

Prices can change; check the Pricing tab of the listing.

## The 300-second limit

The workflow calls Apify's `run-sync-get-dataset-items` endpoint, which waits for the run and returns the rows in one response. Apify answers **408 after 300 seconds**; the node timeout is 310 seconds so you see Apify's answer rather than an n8n timeout. The default input finishes well inside a minute. Adding `fourdayweek` (about 100 polite requests) or all seven boards can take longer than five minutes, so leave those out here, or start the run asynchronously instead (the Python and Node examples in this repository do that). After a 408 the run keeps going on Apify and is still charged, and its new jobs are then counted as seen, so they will not come back on the next run.

## Changing the schedule

Open *Every day at 07:00* and change the interval or the hour. The time is in the workflow's time zone (workflow **Settings > Timezone**, which defaults to the instance time zone). Once a day is the sensible rate: Remotive asks for at most about 4 calls a day and Jobicy at most one an hour, and more frequent runs reuse those boards' previous answer (`dataOrigin: "cache"`).

## Good to know

- Every run that reaches Apify, including a manual **Execute workflow** while you test, updates the change-tracking snapshot. Jobs that a test run delivered count as seen and will not be delivered again. To start over, change `snapshotStoreName`.
- The snapshot belongs to the exact board list and filters. Changing any filter starts a new baseline, and the next run labels every matching job `new` again.
- Boards that cannot be read come back as free `source_status` rows; the Filter node drops them. Open the execution to see them.
- Nothing in the file is personal: credentials are referenced by name only, and the spreadsheet URL is a placeholder.
