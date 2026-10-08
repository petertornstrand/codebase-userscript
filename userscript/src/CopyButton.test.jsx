import React from 'react';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CopyButton from './CopyButton';

const writeText = vi.fn();

beforeEach(() => {
    writeText.mockReset();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    document.body.innerHTML = '<h2 id="subject">#1 Hello</h2><div id="root"></div>';
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
        configurable: true,
        get() { return this.textContent; },
    });
});

function mount(props) {
    const root = document.getElementById('root');
    act(() => render(<CopyButton title="Copy" {...props} />, root));
    return root.querySelector('button');
}

describe('CopyButton', () => {
    it('copies the text of the referenced element', () => {
        mount({ elementId: '#subject' }).click();
        expect(writeText).toHaveBeenCalledWith('#1 Hello');
    });

    it('copies literal text when given', () => {
        mount({ text: '[#1 Hello](http://x)', elementId: '#subject' }).click();
        expect(writeText).toHaveBeenCalledWith('[#1 Hello](http://x)');
    });

    it('applies the icon class', () => {
        expect(mount({ text: 'x', icon: 'icon-copy-link' }).classList.contains('icon-copy-link')).toBe(true);
    });

    it('does nothing when the element is missing', () => {
        mount({ elementId: '#nope' }).click();
        expect(writeText).not.toHaveBeenCalled();
    });
});
