import { Converter } from "@/components/converter";
import { IconLock } from "@/components/icons";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-11 w-full max-w-[960px] items-center justify-between px-4">
          <div className="flex items-center gap-1.5 text-sm text-fg">
            <span aria-hidden className="text-base leading-none">
              🖼️
            </span>
            <span className="font-medium">anyfmt</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <IconLock className="h-3.5 w-3.5" />
            Private · runs on your device
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[708px] px-6 pb-28 pt-10 sm:pt-14">
          <Converter />
        </div>
      </main>
    </>
  );
}
