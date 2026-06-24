import { Platform } from 'react-native';

const CLOUD_NAME    = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

// e_improve: all-in-one color/contrast/saturation boost (free tier)
const TRANSFORMS = ['a_exif', 'e_improve', 'q_auto:best', 'f_auto'].join(',');

export function isCloudinaryConfigured(): boolean {
  const name   = (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? '').trim();
  const preset = (process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '').trim();
  return name.length > 0 && preset.length > 0;
}

export function buildEnhancedUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${TRANSFORMS}/${publicId}`;
}

export type EnhanceResult = {
  originalUri: string;
  enhancedUri: string;
  isDemo: boolean;
  dominantHex?: string;
};

export async function enhanceImage(uri: string): Promise<EnhanceResult> {
  if (!isCloudinaryConfigured()) {
    return { originalUri: uri, enhancedUri: uri, isDemo: true };
  }

  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, ImagePicker returns a blob: or data: URL — fetch it to get the real Blob
    const imgRes = await fetch(uri);
    const blob = await imgRes.blob();
    formData.append('file', blob, 'photo.jpg');
  } else {
    // On native, use the { uri, type, name } object that RN's FormData understands
    formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  }

  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Cloudinary ${res.status}: ${body.slice(0, 200)}`);
  }

  const data: { public_id: string } = await res.json();
  return {
    originalUri: uri,
    enhancedUri: buildEnhancedUrl(data.public_id),
    isDemo: false,
  };
}
