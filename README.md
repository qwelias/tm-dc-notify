# TMUF notification for Discord

## How it works
- Live friends updates:
    1. Logs into player.trackmania.com and reads your buddy list from there
    1. Checks if any online players are in `F_VIPS` list and just logged in
    1. Posts a new message and deletes the old one if any of `F_VIPS` just logged in, otherwise edits old message
- Dedimania notifications:
    1. Gets updated maps from [here](http://dedimania.net/tmstats/?do=stat&Envir=TMU-Island&MapOrder=MAP-DESC&Show=MAPS)
    1. Gets all records for those maps
    1. Notifies only on records that are within `D_TOP` and that are higher than any rec of `D_VIPS`

## Requirement
- `nodejs 14+` or `docker`
- discord bot
- for live friends updates:
    - empty discord channel
    - TM account with some friends

## Setup
- create `.env` file with
    ```
    B_TOKEN=<your dc bot token>
    F_LOGIN=<your tm login>
    F_PASSWORD=<your tm password>
    F_CHANNEL=<friends updates channel id>
    F_VIPS=<friends user logins, ';'-separated list>
    D_VIPS=<dedi user logins, ';'-separated list>
    D_CHANNEL=<dedi notifications channel id>
    D_TOP=<how many positions too consider for dedi notification>
    D_MODE<TAttack or Rounds>
    D_MIN=<filter tracks by min number of records>
    NODE_ENV=production
    ```

## How-to
Either:
- use `docker`
- run `nodejs` manually as described in [Dockerfile](Dockerfile)
