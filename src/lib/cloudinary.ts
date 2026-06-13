const CLOUD_NAME    = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME    ?? '';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

// Transformations applied to every uploaded image
const TRANSFORMS = [
  'e_auto_brightness',
  'e_auto_contrast',
  'e_auto_color',
  'e_straighten',
  'b_white',
  'q_auto:best',
  'f_auto',
].join(',');

export function isCloudinaryConfigured(): boolean {
  return CLOUD_NAME !== '' && UPLOAD_PRESET !== '';
}

export function buildEnhancedUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${TRANSFORMS}/${publicId}`;
}

export type EnhanceResult = {
  originalUri: string;
  enhancedUri: string;
  isDemo: boolean;
};

export async function enhanceImage(uri: string): Promise<EnhanceResult> {
  if (!isCloudinaryConfigured()) {
    return { originalUri: uri, enhancedUri: uri, isDemo: true };
  }

  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    throw new Error(`Cloudinary upload failed: ${res.status}`);
  }

  const data: { public_id: string } = await res.json();
  return {
    originalUri: uri,
    enhancedUri: buildEnhancedUrl(data.public_id),
    isDemo: false,
  };
}
