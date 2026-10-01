import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Website AIEO Checker — AI Search Readiness & AEO Website Audit Tool';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#0b1120',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          border: '1px solid #1e293b',
        }}
      >
        {/* Top Bar: Brand & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            AI
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8' }}>
              Built by SkyDevLab
            </span>
          </div>
        </div>

        {/* Center: Main Titles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            AI Search Readiness Audit
          </div>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Website AIEO Checker
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              margin: 0,
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            Audit crawlability, content structure, structured data, entity clarity, and answer readiness with deterministic rules.
          </p>
        </div>

        {/* Bottom Bar: 5 Audit Dimensions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            paddingTop: '24px',
            borderTop: '1px solid #1e293b',
          }}
        >
          {['Crawlability', 'Content', 'Structured Data', 'Entity Clarity', 'Answer Readiness'].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  color: '#cbd5e1',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
