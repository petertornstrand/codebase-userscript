import { describe, expect, it, vi } from 'vitest';
import { claimPage, getCodebaseConfig, notify, setPlatform } from '../utils';

const config = { cbapi_key: 'k', cbapi_base_url: 'https://api', cb_username: 'u', cb_key: 'c' };

describe('extension platform', () => {
    it('throws without a platform config', () => {
        expect(() => getCodebaseConfig()).toThrow('No Codebase API config found.');
    });

    it('reads the config and sends notifications through the extension', () => {
        const send = vi.fn();
        setPlatform({ config, notify: send });
        expect(getCodebaseConfig()).toEqual(config);
        notify({ title: 'T', text: 'x' });
        expect(send).toHaveBeenCalledWith({ title: 'T', text: 'x', tag: 'harvest' });
    });

    it('reports a missing value', () => {
        setPlatform({ config: { ...config, cb_key: '' }, notify: vi.fn() });
        expect(() => getCodebaseConfig()).toThrow('Missing configuration value for key cb_key.');
    });

    it('lets only one of the userscript and the extension claim the page', () => {
        delete document.documentElement.dataset.cbEnhancer;
        expect(claimPage('extension')).toBe(true);
        expect(claimPage('extension')).toBe(true);
        expect(claimPage('userscript')).toBe(false);
        expect(document.documentElement.dataset.cbEnhancer).toBe('extension');
        delete document.documentElement.dataset.cbEnhancer;
    });
});
