import {createContext} from 'react';
import {getCodebaseConfig, getCodebaseHavestMap} from "./utils";

/**
 * @typedef {Object} HarvestContext
 * @property {string} project_id - The project ID
 * @property {string} client_id - The client ID
 */

/** @var {HarvestContext} initalValue */
const initialValue = (() => {
    const config = getCodebaseConfig();
    const val = getCodebaseHavestMap(config.project_id);
    if (val) {
        return {
            project_id: val.harvest_project_id,
            client_id: val.harvest_client_id,
        };
    }
    else {
        throw new Error('No mapping found for codebase project ID: ' + config.project_id);
    }
})();


export const HarvestContext = createContext(initialValue);