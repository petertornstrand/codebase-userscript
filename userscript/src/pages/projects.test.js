import { beforeEach, describe, expect, it } from 'vitest';
import initProjects from './projects';
import { projectHeader } from '../test/fixtures';

beforeEach(() => {
    document.body.innerHTML = projectHeader;
    window.history.pushState({}, '', '/projects/acme/tickets');
});

describe('project search', () => {
    it('moves the search into a centered header container', () => {
        initProjects();
        const center = document.querySelector('.site-header__center');
        expect(center).not.toBeNull();
        expect(center.querySelector('.site-header__search')).not.toBeNull();
    });

    it('scopes the search to the current project', () => {
        initProjects();
        const hidden = document.querySelector('input[name="projects[]"]');
        expect(hidden.value).toBe('acme');
        expect(document.querySelector('#q').placeholder).toBe('Search Acme Website...');
    });

    it('hides the toolbar search button', () => {
        initProjects();
        const button = document.querySelector('a[data-tooltip="Search"]');
        expect(button.parentElement.classList.contains('userscript-hidden')).toBe(true);
    });

    it('is idempotent', () => {
        initProjects();
        initProjects();
        expect(document.querySelectorAll('input[name="projects[]"]')).toHaveLength(1);
        expect(document.querySelectorAll('.site-header__center')).toHaveLength(1);
    });

    it('does not throw when the header is missing', () => {
        document.body.innerHTML = '';
        expect(() => initProjects()).not.toThrow();
    });
});

describe('open ticket filter', () => {
    it('appends the open status query to the ticket list link', () => {
        initProjects();
        const link = document.querySelector('li.main-menu__item > a');
        expect(link.getAttribute('href')).toBe('/projects/acme/tickets?report=all&query=status:open');
    });
});
