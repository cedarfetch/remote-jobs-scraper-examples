// Print the remote jobs that appeared since the previous run as Markdown list items, with the source board named.
//
// The first run labels every job "new" (it creates the baseline). Run it again later, or put the
// same input on a schedule, and you only get the jobs that are new since then.
//
// If you republish these jobs, follow the terms of the board each job came from. Every row carries
// them in the sourceAttribution field. Link to jobUrl and name the board, as this script does.
//
// Usage:  node 03-daily-new-jobs.mjs
// Needs:  APIFY_TOKEN in the environment.
import { ApifyClient } from 'apify-client';

const ACTOR_ID = 'cedarfetch/remote-jobs-scraper';

const token = process.env.APIFY_TOKEN;
if (!token) {
    console.error('APIFY_TOKEN is not set. Create a token on the Integrations page of Apify Console and export it first.');
    process.exit(1);
}

const runInput = {
    sources: ['remoteok', 'weworkremotely', 'remotive', 'jobicy'],
    categories: ['engineering', 'data'],
    trackChanges: true,
    changesOnly: true,
    changeTypes: ['new'],
    includeDescription: false,
    snapshotStoreName: 'remote-new-jobs-example',
};

const client = new ApifyClient({ token });
const run = await client.actor(ACTOR_ID).call(runInput, { log: null });
if (run.status !== 'SUCCEEDED') {
    console.error(`Run did not succeed: ${run.status} ${run.statusMessage ?? ''}`);
    process.exit(1);
}

let count = 0;
for await (const item of client.dataset(run.defaultDatasetId).listItems()) {
    if (item.recordType !== 'job') {
        if (item.status !== 'ok') console.log(`${item.source}: ${item.status} - ${item.message}`);
        continue;
    }
    count += 1;
    console.log(`- [${item.title}](${item.jobUrl}) at ${item.companyName} (${item.location}), via ${item.source}`);
}
console.log(`\n${count} new jobs since the last run`);
