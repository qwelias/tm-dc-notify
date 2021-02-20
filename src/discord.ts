import DC, { TextChannel } from 'discord.js'

export const send = async (text: string, upd?: boolean) => {
    const msg = channel?.messages.cache.last()
    if (msg?.content === text) return

    if (!upd && msg) return msg?.edit(text)

    return Promise.all([
        msg?.delete(),
        channel?.send(text),
    ])
}

let channel: TextChannel

const ded = (...args: any[]) => {
    console.error(...args)
    process.exit(1)
}

const client = new DC.Client();
client.once('disconnect', ded)
client.once('error', ded)
client.once('ready', async () => {
    channel = client.channels.cache.get(process.env.CHANNEL as string) as TextChannel
    await channel.messages.fetch()
});
client.login(process.env.TOKEN);

