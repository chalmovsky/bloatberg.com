// Small inline icons. 1em square, inherit color.
const svg = (d: string, label?: string) => (
  <svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined}
    aria-label={label} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d={d} />
  </svg>
)

export const MenuIcon = () => svg('M3 6h18M3 12h18M3 18h18')
export const SearchIcon = () => svg('M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5')
export const CloseIcon = () => svg('M5 5l14 14M19 5L5 19')
export const LinkIcon = () => svg('M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1')
export const MailIcon = () => svg('M3 6h18v12H3zM3 7l9 6 9-6')
export const GiftIcon = () => svg('M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1.2C7 7 9 7 12 7zM12 7c1.5-3 5-3.5 5-1.2C17 7 15 7 12 7z')
export const BookmarkIcon = () => svg('M6 3h12v18l-6-4-6 4z')
export const ArrowIcon = () => svg('M5 12h14M13 6l6 6-6 6')
export const ShareIcon = () => svg('M12 3v12M7 8l5-5 5 5M5 13v7h14v-7')
export const XIcon = () => svg('M4 4l16 16M20 4L4 20')
export const InIcon = () => svg('M4 9h3.5v11H4zM5.75 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM10 9h3.3v1.6c.6-1 1.8-1.9 3.6-1.9 3 0 3.6 2 3.6 4.6V20H17v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H10z')
export const ThemeIcon = () => svg('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M12 7h4M12 11h6M12 15h5')
export const CameraIcon = () => svg('M3 8h4l2-3h6l2 3h4v11H3zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z')
