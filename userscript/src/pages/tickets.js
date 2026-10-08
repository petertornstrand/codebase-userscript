import { log } from '../utils';

/**
 * Highlight comments that contain tasks (todo items).
 */
function markCommentsWithTasks() {
    document.querySelectorAll('.Post--full:has(li.todo)').forEach((comment) => {
        comment.classList.add('has-tasks');
    });
}

/**
 * Initialize non-React ticket page improvements.
 */
export default function initTickets() {
    log('Initializing ticket page');
    markCommentsWithTasks();
}
