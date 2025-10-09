import { notify } from './utils';

/**
 * @typedef {Object} CodebaseConfig
 * @property {string} api_key
 */

/**
 * Class CodebaseAPI.
 *
 * @class
 */
export default class CodebaseAPI {

    #baseUrl = 'https://cbapi.ddev.site';

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
            'X-API-Key': this.#config.api_key,
            'Content-Type': 'application/json'
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
        const url = this.#baseUrl + `/${projectId}/ticket/${ticketId}`;
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
     * Get a context.
     *
     * @param {string} projectId
     * @param {number} ticketId
     * @return {Promise<any>}
     */
    async getContext(projectId, ticketId) {
        const url = this.#baseUrl + `/${projectId}/ticket/${ticketId}/context`;
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
        const url = this.#baseUrl + `/${projectId}/assignments`;
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
        const url = this.#baseUrl + `/${projectId}/statuses`;
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