export function GoogleButton() {
  return (
    <a
      href="/api/v1/auth/google"
      className="flex items-center justify-center gap-2.5 rounded-[12px] border-[1.5px] border-gray-300 bg-white py-3.5 text-[14.5px] font-bold text-ink transition-colors hover:bg-gray-100"
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"
        />
        <path
          fill="#4CAF50"
          d="M24 45c5.5 0 10.4-1.9 14.3-5l-6.6-5.4c-2 1.4-4.6 2.4-7.7 2.4-5.2 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 40.6 16.2 45 24 45z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.6 36 45 30.5 45 24c0-1.4-.1-2.7-.4-3.5z"
        />
      </svg>
      المتابعة عبر Google
    </a>
  );
}
