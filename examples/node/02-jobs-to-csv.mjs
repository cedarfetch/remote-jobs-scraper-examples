// Write remote jobs to a CSV file, filtered by category, where you can work from, and minimum pay.
//
// Usage:  node 02-jobs-to-csv.mjs [out.csv] [categories] [location] [minSalaryUsd]
//         categories  comma-separated: engineering, design, product, marketing, sales, support, data,
//                     devops, finance, hr, writing, other (default: engineering,devops,data)
//         location    worldwide, a region (europe, north_america, ...) or a country (US, DE, ...)
//         Example:    node 02-jobs-to-csv.mjs jobs.csv engineering,data europe 90000
// Needs:  APIFY_TOKEN in the environment.
import { writeFileSync } from 'node:fs';
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/remote-jobs-scraper';

const FIELDS = [
    'source', 'jobId', 'title', 'companyName', 'category', 'employmentType', 'location', 'countries',
    'isWorldwide', 'salaryUsdAnnualMin', 'salaryUsdAnnualMax', 'postedAt', 'jobUrl',
];

function csvCell(value) {
    if (value === null || value === undefined) return '';
    const text = String(value);
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const outPath = process.argv[2] ?? 'remote-jobs.csv';
const categories = (process.argv[3] ?? 'engineering,devops,data').split(',');
const runInput = {
    // Four boards keep the run short. Leave "sources" out to read all seven (about five minutes).
    sources: ['remoteok', 'weworkremotely', 'remotive', 'jobicy'],
    categories,
    includeDescription: false,
};
if (process.argv[4]) runInput.locationsAllowed = [process.argv[4]];
if (process.argv[5]) runInput.minSalaryUsd = Number(process.argv[5]);

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

const lines = [FIELDS.join(',')];
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'job') {
        console.log(`${item.source}: ${item.status} - ${item.message}`);
        continue;
    }
    const row = { ...item, countries: (item.countries ?? []).join(';') };
    lines.push(FIELDS.map((field) => csvCell(row[field])).join(','));
}
writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${lines.length - 1} jobs to ${outPath}`);
