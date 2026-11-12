// Run the Remote Jobs Scraper on three boards and print one line per job.
//
// Usage:  node 01-run-and-print.mjs
// Needs:  APIFY_TOKEN in the environment.
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/remote-jobs-scraper';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const runInput = {
    sources: ['remoteok', 'weworkremotely', 'remotive'],
    maxJobs: 20,
    includeDescription: false,
};

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'job') {
        // A board that could not be read comes back as a free status row.
        console.log(`${item.source}: ${item.status} - ${item.message}`);
        continue;
    }
    const low = item.salaryUsdAnnualMin;
    const high = item.salaryUsdAnnualMax;
    const pay = low || high ? `USD ${low} to ${high} a year` : 'no pay published';
    const also = (item.alsoOn ?? []).map((other) => other.source).join(', ');
    console.log(
        `[${item.source}] ${item.title} | ${item.companyName} | ${item.location} | ${pay}`
        + ` | also on: ${also || 'nowhere else'} | ${item.jobUrl}`,
    );
}
