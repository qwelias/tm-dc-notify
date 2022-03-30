import type { Message, TextChannel } from 'discord.js'
import { fmt } from '../discord'
import * as config from '../config'
import * as R from 'remeda'
import os from 'os'

const isProd = process.env['NODE_ENV'] === 'production'

export const handle = async (msgIter: AsyncGenerator<Message>) => {
    for await (const msg of msgIter) {
        if (msg.author.bot) continue
        if (
            !msg.content.startsWith(`<@!${msg.client.user?.id}>`) &&
            !msg.content.startsWith(`<@${msg.client.user?.id}>`)
        ) continue
        if (!msg.channel.isText() || msg.channel.type === 'DM') {
            msg.channel.send('nonono')
            continue
        }

        const [, ...tokens] = msg.content.split(/\s+/).filter(Boolean)
        let node: CommandNode = commands
        const path = []
        while (tokens.length && Object.keys(node).length) {
            const sub = tokens[0] || ''
            if (!(sub in node)) break
            //@ts-ignore
            node = node[sub]
            tokens.shift()
            path.push(sub)
        }

        if (!isProd) console.log(node, path, tokens)
        else await node(msg.channel as TextChannel, tokens).catch(reason => console.warn(reason))
    }
}

const options = {
    players: {
        desc: [
            'List of player logins, line break separated.',
            'If specified then will update only on dedis that are made by one of the players or if someone scores a better time than one of the players.',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.players = values,
        get: (cfg: ChannelDedi) => cfg.players.join('\n') || null,
    },
    top: {
        desc: [
            'Number of top records.',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.top = Number(values[0]) ?? 0,
        get: (cfg: ChannelDedi) => cfg.top,
    },
    min_recs: {
        desc: [
            'Min number of records a track should have.',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.min_recs = Number(values[0]) ?? 1,
        get: (cfg: ChannelDedi) => cfg.min_recs,
    },
    uids: {
        desc: [
            'List of dedi track UIDs, line break separated.',
            'If specified then will update only on selected UIDs',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.uids = values,
        get: (cfg: ChannelDedi) => cfg.uids.join('\n') || null,
    },
    mode: {
        desc: [
            `Play mode. Default: ${fmt.p('TAttack')}.`,
            `Either ${fmt.p('TAttack')} or ${fmt.p('Rounds')}.`,
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.mode = (values[0] ?? 'TAttack'),
        get: (cfg: ChannelDedi) => cfg.mode,
    },
    env: {
        desc: [
            'Environemet. Default: none (any).',
            'Consult dedimania.net for possible values.',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.env = values[0] || '',
        get: (cfg: ChannelDedi) => cfg.env,
    },
    servers: {
        desc: [
            'Server logins. Default: none (any).',
            'Will pass update only if it was affected by one of the servers',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.servers = values,
        get: (cfg: ChannelDedi) => cfg.servers.join('\n') || null,
    },
    include_top: {
        desc: [
            '1 or 0. Default: 0.',
            'Controls whether to include whole top records list into an update or only updated records.',
        ].join('\n'),
        set: (cfg: ChannelDedi, values: string[]) => cfg.include_top = !!Number(values[0]),
        get: (cfg: ChannelDedi) => Number(cfg.include_top),
    },
}

// @ts-ignore
const commands = Object.assign((ch: TextChannel) => commands.help(ch), {
    debug: (ch: TextChannel) => ch.send([
        process.uptime(),
        os.hostname(),
        os.uptime(),
        config.dedi.lastUpdateAt,
    ].join('\n')),
    start: Object.assign((ch: TextChannel) => {
        const cfg = config.dedi.channels[ch.id] || (config.dedi.channels[ch.id] = getDefault())
        if (cfg.enabled) return ch.send(`You what?`)

        cfg.enabled = true
        config.write()
        return ch.send([
            `Oke, now I will spam you with the dedi updates here.`,
            `Ask me ${fmt.p('help')} for configuration options.`,
        ].join('\n'))
    }, { help: (ch: TextChannel) => ch.send('Enables dedi updates for the channel')}),

    stop: Object.assign((ch: TextChannel) => {
        const cfg = config.dedi.channels[ch.id] || (config.dedi.channels[ch.id] = getDefault())
        if (!cfg.enabled) return ch.send(`You what?`)

        cfg.enabled = false
        config.write()
        return ch.send('No more updates, got it.')
    }, { help: (ch: TextChannel) => ch.send('Disables dedi updates for the channel')}),

    set: Object.assign((ch: TextChannel) => ch.send(argMsg), {
        help: (ch: TextChannel) => ch.send('Sets specified configuration option. ' + optionsMsg),
        ...R.mapValues(options, ({ desc, set }) => Object.assign(
            (ch: TextChannel, values: string[] = []) => {
                const cfg = config.dedi.channels[ch.id]
                if (!cfg) return ch.send('You what?')

                set(cfg, values)
                config.write()
                return ch.send('oke')
            },
            { help: (ch: TextChannel) => ch.send(desc) }
        ))
    }),

    get: Object.assign((ch: TextChannel) => ch.send(argMsg), {
        help: (ch: TextChannel) => ch.send(
            'Gets specified configuration option. ' +
            optionsMsg +
            `\n Or ${fmt.p('all')} to get all.`
        ),
        ...R.mapValues(options, ({ desc, get }) => Object.assign(
            (ch: TextChannel) => {
                const cfg = config.dedi.channels[ch.id]
                if (!cfg) return ch.send('You what?')

                return ch.send(readable(get(cfg)))
            },
            { help: (ch: TextChannel) => ch.send(desc) }
        )),
        all: (ch: TextChannel) => {
            const cfg = config.dedi.channels[ch.id]
            if (!cfg) return ch.send('You what?')

            return ch.send(Object.entries(options).map(
                ([name, { get }]) => `${fmt.ub(fmt.p(name))}\n${readable(get(cfg))}`
            ).join('\n\n'))
        },
    }),

    help: (ch: TextChannel) => ch.send([
        `Available commands are:`,
        fmt.p('start'),
        fmt.p('stop'),
        fmt.p('get'),
        fmt.p('set'),
        fmt.p('help'),
        '',
        `You can always add ${fmt.p('help')} to any of the commands above or to any of the nested commands to get more info.`,
    ].join('\n')),
}) as unknown as CommandNode
const argMsg = `Missing arguments. Append ${fmt.p('help')} to get usage.`
const optionsMsg = 'Following options available:\n' + Object.keys(options).map(fmt.p).join('\n')

const readable = (value: any) => value != null ? fmt.p(value) : fmt.i('empty')

const getDefault = () => ({
    enabled: false,
    players: [],
    top: 30,
    min_recs: 1,
    uids: [],
    servers: [],
    mode: 'TAttack',
    include_top: false,
} as ChannelDedi)

type CommandNode =
& ((ch: TextChannel, values?: string[]) => Promise<Message>)
& { [sub: string]: CommandNode }

export type ChannelDedi = {
    enabled: boolean,
    players: string[],
    top: number,
    min_recs: number,
    uids: string[],
    servers: string[],
    mode: string,
    env?: string,
    include_top: boolean,
}
