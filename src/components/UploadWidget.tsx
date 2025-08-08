'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  plantId: string;
};

type Item = {
  name: string;
  progress: number;  // 0..100
  status: 'queued' | 'uploading' | 'done' | 'error';
  error?: string;
};

export default function UploadWidget({ plantId }: Props) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const pick = () => inputRef.current?.click();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = ['image/jpeg', 'image/png'];

    const valid: File[] = [];
    const list: Item[] = [];

    Array.from(files).forEach((f) => {
      if (!ACCEPTED.includes(f.type)) {
        showToast('Unsupported file type. Use JPG or PNG');
        return;
      }
      if (f.size > MAX_SIZE) {
        showToast('File too large (max 5MB)');
        return;
      }
      valid.push(f);
      list.push({ name: f.name, progress: 0, status: 'queued' });
    });

    if (valid.length === 0) {
      e.target.value = '';
      return;
    }

    setItems(list);
    setUploading(true);

    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      try {
        await handleFile(file, (p) => {
          setItems((prev) => {
            const copy = [...prev];
            copy[i] = { ...copy[i], status: 'uploading', progress: p };
            return copy;
          });
        });
        setItems((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'done', progress: 100 };
          return copy;
        });
      } catch (err: any) {
        setItems((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], status: 'error', error: err?.message ?? 'upload failed' };
          return copy;
        });
        showToast(err?.message ?? 'Upload failed');
      }
    }

    setUploading(false);
    router.refresh(); // show new photos
    e.target.value = ''; // reset
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        hidden
        onChange={onPick}
      />
      <button
        type="button"
        className="rounded bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 text-sm disabled:opacity-50 flex items-center gap-2"
        onClick={pick}
        disabled={uploading}
      >
        {uploading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
            />
          </svg>
        )}
        {uploading ? 'Uploading…' : 'Upload photos'}
      </button>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((it, idx) => (
            <div key={idx} className="text-xs text-slate-300">
              <div className="flex items-center gap-2">
                {it.status === 'uploading' && (
                  <svg
                    className="h-3 w-3 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
                    />
                  </svg>
                )}
                <span className="truncate">{it.name}</span>
                <span className="ml-auto">{it.progress}%</span>
              </div>
              <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                <div
                  className={`h-full ${it.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${it.progress}%` }}
                />
              </div>
              {it.status === 'error' && <div className="text-red-400">{it.error}</div>}
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded"
        >
          {toast}
        </div>
      )}
    </div>
  );

  async function handleFile(file: File, onProgress: (p: number) => void) {
    const form = new FormData();
    form.append('file', file);
    form.append('plantId', plantId);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };
      xhr.timeout = 60_000;
      xhr.open('POST', '/api/uploads');
      xhr.send(form);
    });
  }
}
