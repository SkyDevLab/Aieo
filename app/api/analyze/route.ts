import { NextRequest, NextResponse } from 'next/server';
import { runFullAudit, AuditProgressEvent } from '@/lib/audit/orchestrator';
import { SecurityValidationError } from '@/lib/security/url-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  let body: { url?: string; stream?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body. Please provide a { "url": "..." } payload.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const rawUrl = body?.url?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { error: 'URL is required. Please provide a valid website address.' },
      { status: 400, headers: corsHeaders }
    );
  }

  const isStream =
    body.stream === true ||
    req.nextUrl.searchParams.get('stream') === 'true' ||
    req.headers.get('accept')?.includes('text/event-stream');

  if (isStream) {
    // Stream progress via Server-Sent Events (SSE)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const report = await runFullAudit(rawUrl, (progress: AuditProgressEvent) => {
            sendEvent('progress', progress);
          });

          sendEvent('complete', report);
          controller.close();
        } catch (err: unknown) {
          const errorMessage =
            err instanceof SecurityValidationError
              ? err.message
              : err instanceof Error
              ? err.message
              : 'An unexpected error occurred while analyzing the website.';

          sendEvent('error', { error: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  // Non-streaming standard response
  try {
    const report = await runFullAudit(rawUrl);
    return NextResponse.json(report, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        ...corsHeaders,
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof SecurityValidationError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'An unexpected error occurred while analyzing the website.';

    const status =
      err instanceof SecurityValidationError &&
      (err.code === 'PRIVATE_IP_BLOCKED' || err.code === 'INTERNAL_HOST_BLOCKED')
        ? 403
        : 400;

    return NextResponse.json({ error: errorMessage }, { status, headers: corsHeaders });
  }
}
