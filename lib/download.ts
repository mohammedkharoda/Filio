/**
 * Start a browser download and keep the object URL alive long enough for slower
 * browsers to consume it. Revoking it synchronously can cancel the download in
 * Safari and some embedded browsers.
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    throw new Error("Downloads are only available in a browser.");
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
