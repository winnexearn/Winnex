import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

function loadEnv(file) {
  const env = {}
  if (!fs.existsSync(file)) return env
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
  return env
}

const env = loadEnv(envPath)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const urls = [
  // From revid.ai trending today
  'https://www.tiktok.com/@mdmotivator/video/7659284646391188756',
  'https://www.tiktok.com/@leon.buhr5/video/7663056306093313312',
  'https://www.tiktok.com/@nicolejohnseyburke/video/7666586516021366047',
  'https://www.tiktok.com/@chefjoeycharney/video/7664048054130986254',
  'https://www.tiktok.com/@clitdi/video/7665387739650559246',
  'https://www.tiktok.com/@alixearle/video/7663997927756483870',
  'https://www.tiktok.com/@selftaughtpm/video/7662554005360397582',
  'https://www.tiktok.com/@victoriajaiimes/video/7662545993208007966',
  'https://www.tiktok.com/@designlabwithg/video/7661103998929325325',
  'https://www.tiktok.com/@koa._official0/video/7661242709021035784',
  'https://www.tiktok.com/@historyun/video/7661754562348420374',
  // From revid.ai most liked TikToks
  'https://www.tiktok.com/@guccidiary/video/6800856290756283654',
  'https://www.tiktok.com/@anjagregoran/video/7466718723177565462',
  'https://www.tiktok.com/@trishlikefish88/video/7493671426377960747',
  'https://www.tiktok.com/@limmytalks/video/7158910944704335147',
  'https://www.tiktok.com/@sasha_osinovsky/video/7313942220774886702',
  'https://www.tiktok.com/@.isaescu/video/7492574559812504875',
  'https://www.tiktok.com/@jojayjijoju/video/7405062138827394321',
  'https://www.tiktok.com/@musky.off/video/7383484019775769861',
  'https://www.tiktok.com/@ailyncoronelk/video/7421672870683675910',
  'https://www.tiktok.com/@benedetta.magni/video/7160277549870779653',
  'https://www.tiktok.com/@dudamillerx/video/7507421421300108549',
  'https://www.tiktok.com/@mdar1es/video/7450362616389651742',
]

const { data: existing } = await admin
  .from('content_pool')
  .select('url')
  .eq('content_type', 'tiktok_video')

const existingSet = new Set(existing?.map((e) => e.url) || [])

const toInsert = urls
  .filter((u) => !existingSet.has(u))
  .map((u) => ({
    content_type: 'tiktok_video',
    url: u,
    title: null,
    description: null,
    is_active: true,
  }))

if (toInsert.length === 0) {
  console.log(`No new links to insert (${urls.length} already in pool)`)
  process.exit(0)
}

const { error } = await admin.from('content_pool').insert(toInsert)

if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}

console.log(`Inserted ${toInsert.length} tiktok_video links into content_pool`)
