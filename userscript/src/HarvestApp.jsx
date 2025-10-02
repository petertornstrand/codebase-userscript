import React from 'react';
import './styles/Codebase.css';



/**
 * Main application element.
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function CodebaseApp() {
    return (
        <div className="CodebaseApp CodebaseComponent">
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="box__header box__header--padded">
                        <h4 className="text--bold text--micro">Harvest</h4>
                    </div>
                    <div className="island">
                    </div>
                </div>
            </div>
        </div>
    );
}
