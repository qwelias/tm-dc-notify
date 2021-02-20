import DC, { TextChannel } from 'discord.js'

export const edit = async (text: string) => {
    const msg = channel?.messages.cache.last()
    if (msg?.content === text) return

    return msg?.edit(text)
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
    channel.messages.fetch()
});
client.login(process.env.TOKEN);

