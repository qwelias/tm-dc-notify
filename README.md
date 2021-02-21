# TM friends notification for Discord

## How it works
1. Logs into player.trackmania.com and reads your buddy list from there
1. Checks if any online players are in VIPS list and just logged in
1. Posts a new message and deletes the old one if there's any VIPS, otherwise edits old message

## Requirement
- node 14+
- discord bot
- empty discord channel

## Setup
- `.env` file with
    ```
    LOGIN=<your tm username>
    PASSWORD=<your tm password>
    TOKEN=<your discord bot token>
    FRIENDS_CHANNEL=<discord channel id for friends updates>
    VIPS=<friends usernames to notify on, ';' separated>
    DEDI_CHANNEL=<discord channel id for dedi updates>
    ```

## How-to
Read [`Dockerfile`](Dockerfile), it's good for you :)
