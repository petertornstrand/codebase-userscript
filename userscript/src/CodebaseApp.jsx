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
                    <div className="island">
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Reported by</h3>
                                    <p className="Properties__value Properties__value--long">
                                        <span className="user"><a href="">Jenny T</a></span> on <span
                                        className="date">25 Aug at 11:02</span>
                                    </p>
                                </li>
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Participants</h3>
                                    <p className="Properties__value">
                                        <img className="Post__avatar gravatar" width="28" height="28"
                                             src="index_files/56.png"/>
                                        <img className="Post__avatar gravatar" width="28" height="28"
                                             src="index_files/70fdfdce59e492a12c4de721302a7b1c.jpeg"/>
                                    </p>
                                </li>
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Milestone</h3>
                                    <p className="Properties__value Properties__value--long">
                                        <span className="primary"><a href="">Rel 2025-86</a></span> due <span
                                        className="date">October 23rd, 2025</span> &ndash; <span className="user"><a
                                        href="#">Erik P</a></span>
                                    </p>
                                </li>
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Sub-issues</h3>
                                    <p className="Properties__value"><a href="#">#3434 Roller saknar rättighet att lägga till bilder</a></p>
                                    <p className="Properties__value"><a href="#">#3436 Ändra text på engelska programsidor</a></p>
                                </li>
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Blockers</h3>
                                    <p className="Properties__value"><span className="empty">None</span></p>
                                </li>
                            </ul>
                        </div>
                        <div className="CodebaseComponent">
                            <ul className="Properties Properties--column">
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Tags</h3>
                                    <p className="Properties__value">
                                        <span className="TicketProperties__tag col-grey">Needs test</span>
                                        <span className="TicketProperties__tag col-grey">Intermediate</span>
                                    </p>
                                    <p className="Properties__value hidden"><span className="empty">No tags</span></p>
                                </li>
                                <li className="Properties__item">
                                    <h3 className="Properties__title">Branch</h3>
                                    <p className="Properties__value"><span className="text--code"><a href="https://code.happiness.se/projects/ki-profile/repositories/kimulti/tree/3434-ladok-editor-qbank">3434-ladok-roles-qbank</a></span></p>
                                    <p className="Properties__value hidden"><span className="empty">No branch configured</span></p>
                                </li>

                                <li className="Properties__item">
                                    <h3 className="Properties__title">Access</h3>
                                    <p className="Properties__value">Anyone with access</p>
                                    <p className="Properties__value text--negative hidden">Only users from <strong>Happiness</strong></p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
