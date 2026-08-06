import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceToken, deviceType = 'web', onesignalPlayerId } = await request.json();

    if (!userId || !deviceToken) {
      return NextResponse.json({ error: 'Missing required parameters: userId and deviceToken' }, { status: 400 });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('user_devices')
      .upsert(
        {
          user_id: userId,
          device_token: deviceToken,
          device_type: deviceType,
          onesignal_player_id: onesignalPlayerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,device_token' }
      )
      .select();

    if (error) {
      console.error('Error saving device token:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, device: data });
  } catch (err: any) {
    console.error('Device Registration Error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, deviceToken } = await request.json();

    if (!userId || !deviceToken) {
      return NextResponse.json({ error: 'Missing required parameters: userId and deviceToken' }, { status: 400 });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('user_id', userId)
      .eq('device_token', deviceToken);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
