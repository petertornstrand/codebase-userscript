import { createContext } from 'react';
import { getCodebaseConfig } from "./utils";

const initialValue = getCodebaseConfig();

export const CodebaseContext = createContext(initialValue);