import { createContext } from 'react';
import { getUrlContext } from "./utils";

/**
 * @typedef {Object} URLContext
 * @property {string} id - The ticket/milestone/repository ID
 * @property {string} project_id - The project ID
 * @property {string} account_id - The hostname
 * @property {string} url - The full URL
 */

/** @var {URLContext} initalValue */
const initialValue = getUrlContext();

export const URLContext = createContext(initialValue);