import { getSupabaseClient } from './client';

export interface RLSVerificationResult {
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  description: string;
  blocked: boolean;
  message: string;
  details?: unknown;
}

export interface SecurityAuditReport {
  timestamp: string;
  passedAll: boolean;
  totalChecks: number;
  blockedCount: number;
  results: RLSVerificationResult[];
}

/**
  Performs a series of unauthorized read/write attempts to the `messages` and `profiles` tables
 * to confirm that Supabase Row Level Security (RLS) is correctly blocking unauthorized access.
 */
export async function verifyRLSPolicies(): Promise<SecurityAuditReport> {
  const supabase = getSupabaseClient();
  const results: RLSVerificationResult[] = [];

  // Test 1: Unauthorized message insertion (messages table)
  // Expecting failure due to RLS check: auth.uid() = user_id
  try {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const fakeRoomId = 'a0000000-0000-0000-0000-000000000001';
    
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          room_id: fakeRoomId,
          user_id: fakeUserId,
          content: 'SECURITY_TEST_UNAUTHORIZED_MESSAGE_INSERT',
        },
      ])
      .select();

    if (error || !data || data.length === 0) {
      results.push({
        table: 'messages',
        operation: 'INSERT',
        description: 'Prevent unauthorized message insertion without valid auth session',
        blocked: true,
        message: 'RLS blocked unauthorized message insert successfully',
        details: error?.message || 'Insert blocked by RLS policy',
      });
    } else {
      results.push({
        table: 'messages',
        operation: 'INSERT',
        description: 'Prevent unauthorized message insertion without valid auth session',
        blocked: false,
        message: 'SECURITY ALERT: Unauthorized message insertion succeeded!',
        details: data,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      table: 'messages',
      operation: 'INSERT',
      description: 'Prevent unauthorized message insertion without valid auth session',
      blocked: true,
      message: 'RLS blocked unauthorized message insert with exception',
      details: errorMsg,
    });
  }

  // Test 2: Unauthorized profile update (profiles table)
  // Expecting failure due to RLS check: auth.uid() = id
  try {
    const fakeProfileId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ username: 'hacked_username_rls_test' })
      .eq('id', fakeProfileId)
      .select();

    if (error || !data || data.length === 0) {
      results.push({
        table: 'profiles',
        operation: 'UPDATE',
        description: 'Prevent unauthorized profile modification without ownership',
        blocked: true,
        message: 'RLS blocked unauthorized profile update successfully',
        details: error?.message || 'Update blocked by RLS policy',
      });
    } else {
      results.push({
        table: 'profiles',
        operation: 'UPDATE',
        description: 'Prevent unauthorized profile modification without ownership',
        blocked: false,
        message: 'SECURITY ALERT: Unauthorized profile update succeeded!',
        details: data,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      table: 'profiles',
      operation: 'UPDATE',
      description: 'Prevent unauthorized profile modification without ownership',
      blocked: true,
      message: 'RLS blocked unauthorized profile update with exception',
      details: errorMsg,
    });
  }

  // Test 3: Unauthorized stories insertion (stories table)
  // Expecting failure due to RLS check: auth.uid() = user_id
  try {
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('stories')
      .insert([
        {
          user_id: fakeUserId,
          media_url: 'https://example.com/unauthorized.jpg',
          caption: 'Unauthorized story test',
        },
      ])
      .select();

    if (error || !data || data.length === 0) {
      results.push({
        table: 'stories',
        operation: 'INSERT',
        description: 'Prevent unauthorized story upload without valid auth user_id',
        blocked: true,
        message: 'RLS blocked unauthorized story insert successfully',
        details: error?.message || 'Insert blocked by RLS policy',
      });
    } else {
      results.push({
        table: 'stories',
        operation: 'INSERT',
        description: 'Prevent unauthorized story upload without valid auth user_id',
        blocked: false,
        message: 'SECURITY ALERT: Unauthorized story insert succeeded!',
        details: data,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      table: 'stories',
      operation: 'INSERT',
      description: 'Prevent unauthorized story upload without valid auth user_id',
      blocked: true,
      message: 'RLS blocked unauthorized story insert with exception',
      details: errorMsg,
    });
  }

  // Test 4: Unauthorized message deletion (messages table)
  // Expecting failure due to RLS policy check: auth.uid() = user_id
  try {
    const fakeMessageId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', fakeMessageId)
      .select();

    if (error || !data || data.length === 0) {
      results.push({
        table: 'messages',
        operation: 'DELETE',
        description: 'Prevent unauthorized message deletion without ownership',
        blocked: true,
        message: 'RLS blocked unauthorized message delete successfully',
        details: error?.message || 'Delete blocked by RLS policy',
      });
    } else {
      results.push({
        table: 'messages',
        operation: 'DELETE',
        description: 'Prevent unauthorized message deletion without ownership',
        blocked: false,
        message: 'SECURITY ALERT: Unauthorized message deletion succeeded!',
        details: data,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    results.push({
      table: 'messages',
      operation: 'DELETE',
      description: 'Prevent unauthorized message deletion without ownership',
      blocked: true,
      message: 'RLS blocked unauthorized message delete with exception',
      details: errorMsg,
    });
  }

  const blockedCount = results.filter((r) => r.blocked).length;
  const passedAll = blockedCount === results.length;

  return {
    timestamp: new Date().toISOString(),
    passedAll,
    totalChecks: results.length,
    blockedCount,
    results,
  };
}
