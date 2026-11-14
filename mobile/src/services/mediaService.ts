import * as ImagePicker from 'expo-image-picker';
import { apiRequest } from './api';

export type UploadedAsset = { uri: string; fileName: string; contentType: string };
type UploadTicket = { uploadUrl: string; key: string; expiresIn: number };

function contentTypeFor(asset: ImagePicker.ImagePickerAsset): string {
  if (asset.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType)) return asset.mimeType;
  const ext = asset.fileName?.split('.').pop()?.toLowerCase();
  return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
}

async function uploadAsset(uri: string, ticket: UploadTicket, contentType: string) {
  const localResponse = await fetch(uri);
  if (!localResponse.ok) throw new Error('Could not read the selected image from this device.');
  const blob = await localResponse.blob();
  const response = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob as any,
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`S3 image upload failed (${response.status}). ${detail.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220) || 'Check the backend IAM role permissions and the presigned URL Content-Type.'}`);
  }
  return ticket.key;
}

export const mediaService = {
  async uploadProfileImage(asset: ImagePicker.ImagePickerAsset, token: string) {
    const contentType = contentTypeFor(asset);
    const fileName = asset.fileName || `profile-${Date.now()}.${contentType.split('/')[1]}`;
    const ticket = await apiRequest<UploadTicket>('/users/me/profile-image/upload-url', {
      method: 'POST', token, body: { fileName, contentType },
    });
    await uploadAsset(asset.uri, ticket, contentType);
    return apiRequest<{ imageUrl: string | null }>('/users/me/profile-image/complete', {
      method: 'POST', token, body: { key: ticket.key },
    });
  },
  getProfileImageUrl(token: string) {
    return apiRequest<{ imageUrl: string | null }>('/users/me/profile-image', { token });
  },
  async uploadOrderReference(asset: ImagePicker.ImagePickerAsset, token: string) {
    const contentType = contentTypeFor(asset);
    const fileName = asset.fileName || `order-reference-${Date.now()}.${contentType.split('/')[1]}`;
    const ticket = await apiRequest<UploadTicket>('/users/me/order-reference/upload-url', {
      method: 'POST', token, body: { fileName, contentType },
    });
    return uploadAsset(asset.uri, ticket, contentType);
  },
};
