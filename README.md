# TMUF notification for Discord
You can run it yourself, or you can ask me (`qwelias#5829`) to add it to your server,
requires **Manage Server** permissions tho.

Once it's on your server ask it something via mention -- you'll get some help.
All further configuration is done per discord channel, meaning that you can configure different channels differently.

## Requirement
- `nodejs 14+` or `docker`
- discord bot
- for live friends updates:
    - empty discord channel
    - TM account with some friends

## Setup
requires following environment variables:
```
B_TOKEN=<your dc bot token>
F_LOGIN=<your tm login>
F_PASSWORD=<your tm password>
F_CHANNEL=<friends updates channel id>
F_VIPS=<friends user logins, ';'-separated list>
NODE_ENV=production
```

## How-to
Either:
- use `docker`
- run `nodejs` manually as described in [Dockerfile](Dockerfile)
