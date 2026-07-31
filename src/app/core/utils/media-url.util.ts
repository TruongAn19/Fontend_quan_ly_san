export type MediaFolder = 'product' | 'equipment' | 'avatar';

export function resolveMediaUrl(
  image: string | null | undefined,
  folder: MediaFolder,
): string {
  if (!image) {
    if (folder === 'product') return 'assets/img/default-pitch.png';
    if (folder === 'equipment') return 'assets/img/default-equipment.png';
    return '';
  }

  return /^https?:\/\//i.test(image)
    ? image
    : `/resources/images/${folder}/${image}`;
}
