'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import UploadWidget from './UploadWidget';
import CareButtons from './CareButtons';
import type { Photo, Plant } from '@prisma/client';

type PlantWithPhotos = Plant & { photos: Photo[] };

export default function PlantCard({ plant }: { plant: PlantWithPhotos }) {
  const router = useRouter();

  const cover =
    (plant.coverPhotoId && plant.photos.find((p) => p.id === plant.coverPhotoId)) ??
    plant.photos[0] ??
    null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-medium">
            <a href={`/plants/${plant.id}`} className="hover:underline">
              {plant.name}
            </a>
          </div>
          {plant.commonName && (
            <div className="text-xs text-slate-400">{plant.commonName}</div>
          )}
        </div>
        <UploadWidget plantId={plant.id} />
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-slate-800">
        {cover ? (
          <Image
            alt={plant.name}
            src={cover.thumbnailUrl || cover.url}
            width={cover.thumbnailWidth ?? cover.width ?? 800}
            height={cover.thumbnailHeight ?? cover.height ?? 600}
            className="h-full w-full object-cover"
            priority={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center text-slate-500 text-sm">No photo yet</div>
        )}
      </div>

      {plant.photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {plant.photos.map((p) => (
            <div key={p.id} className="relative group">
              <Image
                alt="thumb"
                src={p.thumbnailUrl || p.url}
                width={p.thumbnailWidth ?? p.width ?? 400}
                height={p.thumbnailHeight ?? p.height ?? 300}
                className="h-24 w-full object-cover rounded border border-slate-800"
              />
              <div className="absolute inset-0 hidden group-hover:flex items-end justify-between p-1 bg-black/30 rounded">
                <button
                  aria-label={
                    plant.coverPhotoId === p.id ? 'Cover photo' : 'Set as cover photo'
                  }
                  className={`text-[11px] px-2 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    plant.coverPhotoId === p.id ? 'bg-emerald-600' : 'bg-slate-700 hover:bg-slate-600'
                  } text-white`}
                  onClick={async () => {
                    await fetch(`/api/photos/${p.id}`, {
                      method: 'PATCH',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ action: 'cover' }),
                    });
                    router.refresh();
                  }}
                >
                  {plant.coverPhotoId === p.id ? 'Cover' : 'Set cover'}
                </button>

                <button
                  aria-label="Delete photo"
                  className="text-[11px] px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onClick={async () => {
                    await fetch(`/api/photos/${p.id}`, { method: 'DELETE' });
                    router.refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CareButtons plantId={plant.id} />
    </div>
  );
}
