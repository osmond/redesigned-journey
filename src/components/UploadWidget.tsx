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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();

  const pick = () => inputRef.current?.click();

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const list: Item[] = Array.from(files).map((f) => ({
      name: f.name,
      progress: 0,
      status: 'queued',
    }));
    setItems(list);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
      }
    }

    router.refresh(); // show new photos
    e.target.value = ''; // reset
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
      <button
        type="button"
        className="rounded bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 text-sm"
        onClick={pick}
      >
        Upload photos
      </button>

      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((it, idx) => (
            <div key={idx} className="text-xs text-slate-300">
              <div className="flex items-center gap-2">
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
    </div>
  );

  async function handleFile(file: File, onProgress: (p: number) => void) {
    // 1) Resize + auto-rotate using createImageBitmap + canvas
    const { blob, width, height, outType } = await resize(file, {
      max: 1600,
      quality: 0.85,
    });

    // 2) Create object key & presign
    const ext = outType === 'image/png' ? 'png' : 'jpg';
    const objectKey = `plants/${plantId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const presign = await fetch('/api/uploads/presign', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ objectKey, contentType: outType }),
    }).then((r) => r.json());

    if (!presign?.uploadUrl) throw new Error(presign?.error ?? 'presign failed');

    // 3) Upload with XHR so we can show progress
    await xhrPut(presign.uploadUrl, blob, outType, onProgress);

    // 4) Save Photo row
    const create = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        plantId,
        objectKey,
        url: presign.publicUrl,
        contentType: outType,
        width,
        height,
      }),
    }).then((r) => r.json());

    if (!create?.photo?.id) throw new Error(create?.error ?? 'db save failed');
  }
}

async function resize(
  file: File,
  opts: { max: number; quality: number }
): Promise<{ blob: Blob; width: number; height: number; outType: string }> {
  // auto-rotate via createImageBitmap (most modern browsers)
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width: w, height: h } = bmp;

  const scale = Math.min(1, opts.max / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0, width, height);

  const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), outType, opts.quality));

  return { blob, width, height, outType };
}

function xhrPut(url: string, blob: Blob, contentType: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error('network error'));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(String(xhr.status))));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(blob);
  });
}
