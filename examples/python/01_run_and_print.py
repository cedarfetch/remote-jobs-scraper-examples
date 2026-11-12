"""Run the Remote Jobs Scraper on three boards and print one line per job.

Usage:  python 01_run_and_print.py
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
        "sources": ["remoteok", "weworkremotely", "remotive"],
        "maxJobs": 20,
        "includeDescription": False,
    }

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    for item in client.dataset(run.default_dataset_id).iterate_items():
        if item["recordType"] != "job":
            # A board that could not be read comes back as a free status row.
            print(f"{item['source']}: {item['status']} - {item['message']}")
            continue
        low, high = item["salaryUsdAnnualMin"], item["salaryUsdAnnualMax"]
        pay = f"USD {low} to {high} a year" if low or high else "no pay published"
        also = ", ".join(other["source"] for other in item["alsoOn"] or [])
        print(
            f"[{item['source']}] {item['title']} | {item['companyName']} | {item['location']} | {pay}"
            f" | also on: {also or 'nowhere else'} | {item['jobUrl']}"
        )


if __name__ == "__main__":
    main()
