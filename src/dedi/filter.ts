import * as config from '../config'
import type { TrackUpdate, RecUpdate } from './mania'

export function* perChannel({ env, uid }: TrackUpdate, allRecs: RecUpdate[]) {
    for (const [chId, cfg] of Object.entries(config.dedi.channels)) {
        if (
            !cfg.enabled ||
            (cfg.uids.length && !cfg.uids.includes(uid)) ||
            (cfg.env && cfg.env?.toLowerCase() !== env.toLowerCase())
        ) continue

        let recs = allRecs.filter(({ mode }) => mode.toLowerCase() === cfg.mode?.toLowerCase())
        if (recs.length < cfg.min_recs) continue

        recs = recs.slice(0, cfg.top)
        if (!recs.some(
            ({ up, server }) => up && (cfg.servers.length ? cfg.servers.includes(server) : true)
        )) continue

        if (!cfg.players.length) {
            recs = cfg.include_top ? recs : recs.filter(({ up }) => up)
            if (recs.length) yield [chId, recs] as const
            continue
        }

        const worthy = new Map()
        recs.reduceRight((pass, rec) => {
            if (cfg.players.includes(rec.login)) pass = true
            if (rec.up && pass) worthy.set(rec, true)
            return pass
        }, false)
        if (!worthy.size) continue

        recs = cfg.include_top ? recs : recs.filter(rec => worthy.get(rec))
        yield [chId, recs] as const
    }
}
