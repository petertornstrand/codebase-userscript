import { notify } from './utils';

/**
 * @typedef {Object} CodebaseConfig
 * @property {string} username
 * @property {string} api_key
 */

/**
 * Class CodebaseAPI.
 *
 * @class
 */
export class CodebaseAPI {

    #baseUrl = 'https://api3.codebasehq.com';

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
            'Accept': 'application/xml',
            'Authorization': 'Basic ' + btoa(this.#config.username + ':' + this.#config.api_key),
            'Content-Type': 'application/xml'
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
        const url = this.#baseUrl + `/${projectId}/tickets?query=id:${ticketId}`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            // str => new window.DOMParser().parseFromString(str, "text/xml")
            return await response.text();
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

            // str => new window.DOMParser().parseFromString(str, "text/xml")
            return await response.text();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' });
        }
    }
}