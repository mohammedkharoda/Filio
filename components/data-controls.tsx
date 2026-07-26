"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PiCheckCircle, PiDownloadSimple, PiTrash, PiUploadSimple } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { downloadExportFile, deleteAllData, parseImportFile } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Export / import progress and the "Delete all my data" control (§4). */
export function DataControls() {
  const router = useRouter();
  const data = useFilioStore((s) => s.data);
  const importData = useFilioStore((s) => s.importData);
  const reset = useFilioStore((s) => s.reset);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [exported, setExported] = React.useState(false);
  const exportTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (exportTimer.current) clearTimeout(exportTimer.current);
    },
    [],
  );

  function onExport() {
    downloadExportFile(data);
    setExported(true);
    if (exportTimer.current) clearTimeout(exportTimer.current);
    exportTimer.current = setTimeout(() => setExported(false), 3_000);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImportFile(String(reader.result));
        importData(parsed);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Couldn't import that file.");
      }
    };
    reader.readAsText(file);
  }

  async function onDeleteAll() {
    await deleteAllData();
    reset();
    router.push("/");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExport}>
        {exported ? (
          <PiCheckCircle className="h-4 w-4 text-success" />
        ) : (
          <PiDownloadSimple className="h-4 w-4" />
        )}
        {exported ? "Progress exported" : "Export progress"}
      </Button>

      <label>
        <input type="file" accept=".json,.filio.json,application/json" className="sr-only" onChange={onImport} />
        <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold hover:bg-muted/60">
          <PiUploadSimple className="h-4 w-4" /> Import
        </span>
      </label>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
            <PiTrash className="h-4 w-4" /> Delete all my data
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete all your data?</DialogTitle>
            <DialogDescription>
              This permanently erases everything Filio has stored in this browser and resets the app.
              If you want to keep a copy, use “Save progress” first. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={onDeleteAll}>
                <PiTrash className="h-4 w-4" /> Delete everything
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {importError ? (
        <p className="w-full text-sm font-medium text-destructive">{importError}</p>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {exported ? "Your Filio progress file was downloaded." : ""}
      </span>
    </div>
  );
}

/** Small "saved" reassurance indicator. */
export function SaveStatus() {
  const lastSavedAt = useFilioStore((s) => s.lastSavedAt);
  if (!lastSavedAt) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium text-success"
      aria-live="polite"
    >
      <PiCheckCircle className="h-4 w-4 shrink-0" aria-hidden /> Saved to this device
    </span>
  );
}
