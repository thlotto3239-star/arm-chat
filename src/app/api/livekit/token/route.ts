import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET(request: NextRequest) {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  const livekitUrl = env.LIVEKIT_URL;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit API key and secret must be set' }, { status: 500 });
  }
  if (!livekitUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_LIVEKIT_URL must be set' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room') || 'arm-chat-room';
  const username = searchParams.get('username') || `user_${Math.floor(Math.random() * 10000)}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();

  return NextResponse.json({ token, url: livekitUrl });
}