"""Write remote jobs to a CSV file, filtered by category, where you can work from, and minimum pay.

Usage:  python 02_jobs_to_csv.py [out.csv] [categories] [location] [min_salary_usd]
        categories  comma-separated: engineering, design, product, marketing, sales, support, data,
                    devops, finance, hr, writing, other (default: engineering,devops,data)
        location    worldwide, a region (europe, north_america, ...) or a country (US, DE, ...)
        Example:    python 02_jobs_to_csv.py jobs.csv engineering,data europe 90000
Needs:  APIFY_TOKEN in the environment.
"""
import csv
import os
import sys

from apify_client import ApifyClient

ACTOR_ID = "cedarfetch/remote-jobs-scraper"

FIELDS = [
    "source", "jobId", "title", "companyName", "category", "employmentType", "location", "countries",
    "isWorldwide", "salaryUsdAnnualMin", "salaryUsdAnnualMax", "postedAt", "jobUrl",
]


def main() -> None:
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        sys.exit("APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.")

    out_path = sys.argv[1] if len(sys.argv) > 1 else "remote-jobs.csv"
    categories = (sys.argv[2] if len(sys.argv) > 2 else "engineering,devops,data").split(",")
    run_input = {
        # Four boards keep the run short. Leave "sources" out to read all seven (about five minutes).
        "sources": ["remoteok", "weworkremotely", "remotive", "jobicy"],
        "categories": categories,
        "includeDescription": False,
    }
    if len(sys.argv) > 3:
        run_input["locationsAllowed"] = [sys.argv[3]]
    if len(sys.argv) > 4:
        run_input["minSalaryUsd"] = int(sys.argv[4])

    client = ApifyClient(token)
    run = client.actor(ACTOR_ID).call(run_input=run_input, logger=None)
    if run is None or run.status != "SUCCEEDED":
        sys.exit(f"Run did not succeed: {run.status if run else 'no run'} {(run.status_message or '') if run else ''}")

    rows = 0
    with open(out_path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        for item in client.dataset(run.default_dataset_id).iterate_items():
            if item["recordType"] != "job":
                print(f"{item['source']}: {item['status']} - {item['message']}")
                continue
            item["countries"] = ";".join(item["countries"] or [])
            writer.writerow(item)
            rows += 1
    print(f"Wrote {rows} jobs to {out_path}")


if __name__ == "__main__":
    main()
