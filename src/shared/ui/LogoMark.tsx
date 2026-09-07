export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <span className="brand-mark" style={{ height: size, width: size }} aria-hidden="true">
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 22V10l9 9 9-9v12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
