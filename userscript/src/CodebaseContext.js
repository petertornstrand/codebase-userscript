import {createContext,useContext} from 'react';
import {CodebaseAPI} from './CodebaseAPI';
import {getCodebaseConfig} from "./utils";
import {URLContext} from './URLContext';

/**
 * @typedef {Object} CodebaseContext
 * @property {CodebaseAPI} api - The API
 * @property {array} ticket - The ticket
 * @property {array} users - The users
 */


/** @var {CodebaseContext} initalValue */
const initialValue = (() => {
    const config = getCodebaseConfig();
    const api = new CodebaseAPI(config);
    return {
        api: api,
        ticket: [],
        users: []
    };
})();


export const CodebaseContext = createContext(initialValue);