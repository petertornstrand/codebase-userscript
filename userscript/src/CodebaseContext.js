import {createContext} from 'react';
import {CodebaseAPI} from './CodebaseAPI';
import {getCodebaseConfig} from "./utils";

/**
 * @typedef {Object} CodebaseContext
 * @property {CodebaseAPI} api - The API
 * @property {array} ticket - The ticket
 * @property {array} users - The users
 */

/** @var {CodebaseContext} initalValue */
const initialValue = (() => {
    const config = getCodebaseConfig();
    return {
        api: new CodebaseAPI(config),
        ticket: [],
        users: []
    };
})();


export const CodebaseContext = createContext(initialValue);