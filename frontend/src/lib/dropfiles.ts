/**
 * Reads files from a drag-and-drop event, recursing into dropped directories so
 * folder structure is preserved. Each returned entry carries its path relative
 * to the drop root, which we forward as the multipart filename.
 */
export interface DroppedFile {
  file: File;
  path: string;
}

export async function readDroppedFiles(dt: DataTransfer): Promise<DroppedFile[]> {
  const items = Array.from(dt.items).filter((i) => i.kind === 'file');
  const supportsEntries = items.some((i) => typeof (i as any).webkitGetAsEntry === 'function');

  if (!supportsEntries) {
    return Array.from(dt.files).map((file) => ({ file, path: file.name }));
  }

  const results: DroppedFile[] = [];
  const roots = items
    .map((i) => (i as any).webkitGetAsEntry?.() as FileSystemEntry | null)
    .filter(Boolean) as FileSystemEntry[];

  await Promise.all(roots.map((entry) => walk(entry, '', results)));
  return results;
}

async function walk(entry: FileSystemEntry, prefix: string, out: DroppedFile[]): Promise<void> {
  if (entry.isFile) {
    const file = await fileFromEntry(entry as FileSystemFileEntry);
    out.push({ file, path: prefix + entry.name });
    return;
  }
  if (entry.isDirectory) {
    const dir = entry as FileSystemDirectoryEntry;
    const reader = dir.createReader();
    const entries = await readAllEntries(reader);
    await Promise.all(entries.map((e) => walk(e, `${prefix}${entry.name}/`, out)));
  }
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

// readEntries returns at most 100 entries per call, so loop until drained.
function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const next = () => {
      reader.readEntries((batch) => {
        if (!batch.length) return resolve(all);
        all.push(...batch);
        next();
      }, reject);
    };
    next();
  });
}
