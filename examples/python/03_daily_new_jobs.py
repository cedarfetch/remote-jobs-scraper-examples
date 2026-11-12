"""Print the remote jobs that appeared since the previous run as Markdown list items, with the source board named.

The first run labels every job "new" (it creates the baseline). Run it again later, or put the
same input on a schedule, and you only get the jobs that are new since then.

If you republish these jobs, follow the terms of the board each job came from. Every row carries
them in the sourceAttribution field. Link to jobUrl and name the board, as this script does.

Usage:  python 03_daily_new_jobs.py
Needs:  APIFY_TOKEN in the environment.
"""
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/remote-jobs-scraper"


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    run_input = {
        "sources": ["remoteok", "weworkremotely", "remotive", "jobicy"],
        "categories": ["engineering", "data"],
        "trackChanges": True,
        "changesOnly": True,
        "changeTypes": ["new"],
        "includeDescription": False,
        "snapshotStoreName": "remote-new-jobs-example",
    }

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    count = 0
    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] != "job":
            if item["status"] != "ok":
                print(f"{item['source']}: {item['status']} - {item['message']}")
            continue
        count += 1
        print(f"- [{item['title']}]({item['jobUrl']}) at {item['companyName']} ({item['location']}), via {item['source']}")
    print(f"\n{count} new jobs since the last run")


if __name__ == "__main__":
    main()
