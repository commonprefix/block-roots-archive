# Block roots archive

The Block Roots Archive is a caching layer including a data scraper and a server designed to aggregate and provide access to all the block roots within a single Sync Committee period of the Beacon API of Ethereum. This system features a scraper responsible for continually updating an SQLite database with new block roots and retroactively filling in data for past blocks. Additionally, it includes an API that offers a endpoint to retrieve block roots for any given period.

# Motivation: Generating Ancestry proofs

As outlined here, within Ethereum's consensus layer, there are primarily two ways to prove that a block is a predecessor of another one. The initial approach leverages the `block_roots` property of the beacon state, encapsulating the roots of blocks from the most recent period (approximately 27 hours). For blocks extending beyond this timeframe, the `historical_summaries` beacon state attribute comes into play.

More precisely, the block_roots attribute is a vector that holds the roots of blocks within the current historical root timeframe. This vector is fixed in size, equivalent to the SLOTS_PER_HISTORICAL_ROOT ETH constant, which is presently 8192. Upon reaching its capacity, the vector undergoes Merkleization, and its root is then preserved within the `historical_summaries`` vector.

In scenarios where the Beacon root that we want to generate the ancestry proof for is recent enough, a Merkle inclusion proof suffices. But in the latter case where the block is older than 8192 blocks (~27 hours), the Merkle tree of the `block_roots`` of that specific period must be reconstructed. Given the absence of a mechanism to batch request 8192 block roots in the Beacon API, this implementation scrapes and serves the block_roots for sync-committee periods in a single request. 

## Setup

- Copy `.env.template` to `.env` and populate it accordingly 
- Run `yarn` to install necessary dependencies.

## Scraping

During the first time that the scraper will start, it will initialize the database automatically. Currently, there are 2 supported methods

- *Backfilling*: Starting from the `startSlot` stated in the `.env` file, the scraper will start backfilling the block roots till it fails or reaches block 0. This is enabled by setting the `BACKFILL_MODE` to true on the `.env` file.
- *Syncing*: Starting from the `startSlot` stated in the `.env` file, the scraper will start scraping block roots indefinitely to always stay in sync with the newly minted block roots. This is the default mode if nothing is set to the `.env` file.

To start the scraper, just run `yarn scrape`.

## Serving

Considering that the SQLite database is populated with the periods that we are interested in, running `yarn serve` will expose a single endpoint:

### Block Summary

This endpoint returns a vector of `SLOTS_PER_HISTORICAL_ROOT` (8192) block roots. The request must specify the sync committee period.

```http
GET /block_summary?period=12
```

#### Example responses

```json
  {
    "code":200,
    "data":["0xe4f5947b48bc7bc4cdde1013f3f28ba681633cd4d75a5b7e395b348e38111704", ".", ".", "." ]
  }
```

```json
  {
    "code":404,
    "message":"Block roots tree not found for period: 23432"
  }
```
