import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerBrowserDownload } from "./download";

describe("browser downloads", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("clicks a hidden download link and revokes the URL after a safe delay", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn(() => "blob:filio-test");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    let clickedDownload = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clickedDownload = this.download;
    });

    triggerBrowserDownload(new Blob(["private data"]), "filio-progress.filio.json");

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(clickedDownload).toBe("filio-progress.filio.json");
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:filio-test");
  });
});
