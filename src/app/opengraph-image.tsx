import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Winnex Earn - Earn Money from TikTok Videos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '48px', fontWeight: 800, color: '#fff' }}>W</span>
          </div>
          <span style={{ fontSize: '48px', fontWeight: 700, color: '#fff' }}>
            Winnex Earn
          </span>
        </div>

        <div
          style={{
            fontSize: '36px',
            fontWeight: 600,
            color: '#d1fae5',
            textAlign: 'center',
            lineHeight: 1.3,
            marginBottom: '20px',
          }}
        >
          Earn Money by Watching TikTok Videos
        </div>

        <div
          style={{
            fontSize: '24px',
            color: '#a7f3d0',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Free to join  •  Earn up to ₦9,000/month  •  Daily payouts
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '20px',
            color: '#6ee7b7',
          }}
        >
          winnexearn.site
        </div>
      </div>
    ),
    { ...size }
  )
}
