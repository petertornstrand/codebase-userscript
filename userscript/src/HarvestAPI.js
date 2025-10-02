import { notify } from './utils';

/**
 * Class HarvestAPI.
 *
 * @class
 */
export class HarvestAPI {

    #baseUrl = 'https://api.harvestapp.com/api';
    #config  = {};

    /**
     * Class constructor.
     *
     * @param {Object}  config
     * @param {string}  config.account_id
     * @param {string}  config.access_token
     * @param {string}  config.user_agent
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
            'Harvest-Account-Id': this.#config.account_id,
            'Authorization': 'Bearer ' + this.#config.access_token,
            'User-Agent': this.#config.user_agent
        };
        return Object.assign({}, defaultHeaders, headers);
    }

    /**
     * Get the current user.
     *
     * @return {Promise<any>}
     */
    async getMe() {
        const url = this.#baseUrl + '/v2/users/me';
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' })
        }
    }

    /**
     * Get a user.
     *
     * @param {string} userId
     * @return {Promise<any>}
     */
    async getUser(userId){

    }

    /**
     * Get a project.
     *
     * @param {string} [projectId] - The project ID.
     * @return {Promise<any>}
     */
    async getProject(projectId) {
        const url = this.#baseUrl + '/v2/projects/' + projectId;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders()
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' })
        }
    }

    /**
     * Get tasks.
     *
     * @param {string} projectId
     * @return {Promise<any>}
     */
    async getTasks(projectId) {
        const url = this.#baseUrl + `/v2/projects/${projectId}/task_assignments?is_active=true`;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' })
        }
    }

    /**
     * Get time entries.
     *
     * @param {string} clientId
     * @param {string} projectId
     * @return {Promise<any>}
     */
    async getTimeEntries(clientId, projectId) {
        const today = new Date().toISOString().slice(0, 10);
        const parameter = new URLSearchParams({
            client_id: clientId,
            project_id: projectId,
            from: today,
            to: today
        }).toString();
        const url = this.#baseUrl + '/v2/time_entries?' + parameter;
        try {
            const response = await fetch(url, {
                headers: this.#getHeaders(),
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' })
        }
    }

    /**
     * Add time entry.
     *
     * @param {Object}  parameters
     * @param {int}     parameters.project_id
     * @param {int}     parameters.task_id
     * @param {string}  [parameters.spent_date]
     * @param {float}   [parameters.hours]
     * @param {string}  [parameters.notes]
     * @param {Object}  [parameters.external_reference]
     * @param {string}  parameters.external_reference.id
     * @param {string}  parameters.external_reference.group_id
     * @param {string}  parameters.external_reference.account_id
     * @param {string}  parameters.external_reference.permalink
     * @return {Promise<any>}
     */
    async addTimeEntry(parameters ) {
        if (!parameters.hasOwnProperty('spent_date')) {
            parameters.spent_date = new Date().toISOString().slice(0, 10);
        }

        const url = this.#baseUrl + '/v2/time_entries';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.#getHeaders({ 'Content-type': 'application/json' }),
                body: JSON.stringify(parameters)
            });
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            notify({ title: error.name, text: error.message, tag: 'error' })
        }
    }
}