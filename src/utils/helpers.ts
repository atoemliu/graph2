export function debounce<T extends (...args: any[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return function (this: unknown, ...args: Parameters<T>): void {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const Theme = {
    isDarkTheme(): boolean {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    },
    getThemeTextColor(): string {
        return this.isDarkTheme() ? '#E8E8EA' : '#1f1a10';
    },
    getThemeGridColor(): string {
        return this.isDarkTheme() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    }
};
