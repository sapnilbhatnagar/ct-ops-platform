export function TopBar({ section }: { section?: string }) {
  return (
    <header
      data-testid="console-topbar"
      className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-x-0 border-t-0 border-b border-rule px-8"
    >
      <div className="flex items-center gap-3 text-[12.5px] text-mute">
        <span>Connecting Traveller</span>
        {section ? (
          <>
            <span aria-hidden className="text-rule">
              ›
            </span>
            <span className="text-ink">{section}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-[12.5px] text-mute">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-tile px-2.5 py-1">
          <span className="size-1.5 rounded-full bg-ok" />
          Sim mode · v1
        </span>
      </div>
    </header>
  );
}
