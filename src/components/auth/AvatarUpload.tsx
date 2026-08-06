'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Avatar } from '@/shared/design-system';

/**
 * AvatarUpload — circular avatar picker per arm_chat_2:179-192.
 * Uploads to Supabase Storage `avatars` bucket, exposes the public URL via onChange.
 */

export type AvatarUploadProps = {
  value: string;
  onChange: (url: string) => void;
  name?: string;
  disabled?: boolean;
};

export function AvatarUpload({ value, onChange, name, disabled }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      alert('ไม่สามารถอัปโหลดรูปภาพได้: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-sm">
      <div className="relative group">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="relative block rounded-full overflow-hidden border-2 border-ink cursor-pointer disabled:opacity-50 transition-transform group-hover:scale-[1.02]"
          aria-label="อัปโหลดรูปโปรไฟล์"
        >
          <Avatar src={value || null} name={name} size="xl" />
          <span className="absolute inset-0 bg-ink/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-surface-white text-[28px]">photo_camera</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-primary-container border border-ink rounded-full flex items-center justify-center shadow-md disabled:opacity-50"
          aria-label="เพิ่มรูปโปรไฟล์"
        >
          <span className="material-symbols-outlined text-ink text-[20px]">
            {uploading ? 'progress_activity' : 'add'}
          </span>
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <span className="text-xs text-ink-muted">คลิกเพื่ออัปโหลดรูปภาพโปรไฟล์</span>
    </div>
  );
}

export default AvatarUpload;
