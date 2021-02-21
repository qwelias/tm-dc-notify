import { makeRequest } from './request'
import { parseHTML } from 'linkedom'
import qs from 'querystring'
import * as R from 'remeda'

export const poll = async () => {
    const res = await login(await getCookie())
    const { document } = parseHTML(await res.text())
    const [, ...list] = document.querySelectorAll('#ladder tr')
    return R.mergeAll(list.map(tr => {
        let [nameE, onlineE, serverE] = tr.children
        if (!onlineE.children.length) return

        const name = nameE.textContent?.replace(/&nbsp;/g, ' ')
        const server = serverE.children[0]?.getAttribute('onclick')?.match(/join=(.*)?'/)?.[1]
        return {
            [nameE.getAttribute('title') as string]: {
                name,
                server,
            }
        }
    }) as any) as Record<string, Player>
}

export type Player = { name: string, server?: string }

export const hash = ({ name, server }: Player) => name + '|' + server

const request = makeRequest('https://player.trackmania.com')

const getCookie = async () => {
    const res = await request('/')
    // @ts-ignore yolo
    return res.headers.get('set-cookie').split(';')[0]
}

const login = async (cookie: string) => request(
    '/main.php',
    {
        method: 'POST',
        body: qs.stringify({
            login: process.env.LOGIN,
            password: process.env.PASSWORD,
            application: '',
            userlogin: '',
            redirection: '',
            coppers: 0,
            submitLogin: 'Connexion',
        }),
        headers: {
            cookie,
            'content-type': 'application/x-www-form-urlencoded',
        }
    },
)
