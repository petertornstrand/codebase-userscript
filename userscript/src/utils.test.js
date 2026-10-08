import { beforeEach, describe, expect, it } from 'vitest';
import { findCodebaseAvatar } from './utils';

beforeEach(() => {
    document.body.innerHTML = `<div id="content">
        <div class="Post__header"><img class="Post__avatar" id="a"><span class="text--bold"><a class="text--link"> Ada Lovelace </a></span></div>
        <ul><li class="ThreadChanges__event"><img class="ThreadChanges__avatar" id="b"><span class="text--bold"><a class="text--link">Grace Hopper</a></span> changed it</li></ul>
    </div>`;
});

describe('findCodebaseAvatar', () => {
    it('finds the avatar of a commenter', () => {
        expect(findCodebaseAvatar('Ada Lovelace').id).toBe('a');
    });

    it('finds the avatar of a user who only changed the ticket', () => {
        expect(findCodebaseAvatar('Grace Hopper').id).toBe('b');
    });

    it('returns null for unknown users', () => {
        expect(findCodebaseAvatar('Nobody')).toBeNull();
    });
});
