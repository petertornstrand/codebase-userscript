import { notify } from './utils';

/**
 * @typedef {Object} CodebaseConfig
 * @property {string} cbapi_key
 * @property {string} cbapi_base_url
 * @property {string} cb_username
 * @property {string} cb_key
 */

/**
 * Ticket formats.
 * @type {{FULL: symbol, MIN: symbol}}
 */
export const TICKET_FORMAT = {
    FULL: Symbol('full'),
    MIN: Symbol('min'),
};

/**
 * Class CodebaseAPI.
 *
 * This class provides a wrapper around the Codebase API Gateway that acts as a
 * proxy for the Codebase API. The gateway uses simple authentication and
 * modifies the responses to use JSON instead of XML. It also decorates the
 * data with additional information.
 *
 * @class
 */
export default class CodebaseAPI {

    /** @var {CodebaseConfig} */
    #config;

    /**
     * Class constructor.
     *
     * @param {CodebaseConfig}  config
     */
    constructor(config) {
        this.#config = config;
    }

    /**
     * Build the header array.
     *
     * @param {Object} [headers] - Additional headers.
     * @return {Object}
     */
    #getHeaders(headers = {}) {
        const defaultHeaders = {
            'Accept': 'application/json',
            'X-API-Key': this.#config.cbapi_key,
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(this.#config.cb_username + ':' + this.#config.cb_key)
        };
        return Object.assign({}, defaultHeaders, headers);
    }

    /**
     * Get a ticket.
     *
     * @param {string} projectId
     * @param {string} ticketId
     * @return {Promise<any>}
     */
    async getTicket(projectId, ticketId) {
        const url = this.#config.cbapi_base_url + `/${projectId}/ticket/${ticketId}`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }
    /**
     * Get multiple ticket.
     *
     * @param {string} projectId
     * @param {Array} ticketIds
     * @param {Symbol} [format=TICKET_FORMAT.FULL]
     * @return {Promise<any>}
     */
    async getMultipleTickets(projectId, ticketIds, format=TICKET_FORMAT.FULL) {
        const query = ticketIds.map(id => `id:${id}`).join('+');
        const url = this.#config.cbapi_base_url + `/${projectId}/tickets?query=${query}`;
        let headers = {};
        if (format !== TICKET_FORMAT.FULL) {
           headers = { 'Prefer': 'format=' + format.description };
        }
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders(headers)
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }


    /**
     * Get a context.
     *
     * @param {string} projectId
     * @param {number} ticketId
     * @return {Promise<any>}
     */
    async getContext(projectId, ticketId) {
        const url = this.#config.cbapi_base_url + `/${projectId}/ticket/${ticketId}/context`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }

    /**
     * Get project users.
     *
     * @param {string} projectId
     * @return {Promise<any>}
     */
    async getUsers(projectId) {
        const url = this.#config.cbapi_base_url + `/${projectId}/assignments`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }

    /**
     * Get project statuses.
     *
     * @param {string} projectId
     * @return {Promise<any>}
     */
    async getStatuses(projectId) {
        const url = this.#config.cbapi_base_url + `/${projectId}/statuses`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }
}