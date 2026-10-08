// Stand-ins for the userscript manager APIs, for the live preview.
// Loaded as a classic script before the userscript itself.
(function () {
    const config = {
        cbapi_base_url: location.origin + '/__api',
        cbapi_key: 'preview',
        cb_username: 'preview',
        cb_key: 'preview',
    };

    window.GM_getValues = (keys) => Object.fromEntries(keys.map((key) => [key, config[key]]));
    window.GM_getValue = (key, fallback) => config[key] ?? fallback;

    window.GM_notification = (notification) => {
        console.warn('[GM_notification]', notification);
        const toast = document.createElement('div');
        toast.textContent = `${notification.title ?? 'Notification'}: ${notification.text ?? ''}`;
        toast.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:99999;padding:8px 12px;'
            + 'background:#222;color:#fff;font:13px sans-serif;border-radius:4px;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 6000);
    };
})();
