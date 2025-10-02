import React,{useState,useContext} from 'react';
import {QueryClient,QueryClientProvider,useQuery} from "react-query";
import {HarvestAPI} from './HarvestAPI';
import './styles/Harvest.css';
import {HarvestContext} from "./HarvestContext";
import {CodebaseContext} from "./CodebaseContext";
import {getCodebaseConfig,getHarvestConfig, notify} from "./utils";

// Application global constants.
const harvest = getHarvestConfig();
const api = new HarvestAPI(harvest);
const queryClient = new QueryClient();

/**
 * Main application element.
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function HarvestApp() {
    return (
        <div className="HarvestApp HarvestComponent">
            <div className="sidebar__module sidebar__module--medium">
                <div className="box box--sidebar">
                    <div className="box__header box__header--padded">
                        <h4 className="text--bold text--micro">Harvest</h4>
                    </div>
                    <div className="island">
                        <ReportTime />
                        <TimeEntries />
                    </div>
                </div>
            </div>
        </div>
    );
}


/**
 * Report time element.
 *
 * @return {JSX.Element}
 * @constructor
 */
function ReportTime() {
    /** @var {string} taskId - State variable for selected task ID */
    const [taskId, setTaskId] = useState('');

    /** @var {string|null} hours - State variable for entered hours */
    const [hours, setHours] = useState(null);

    /** @var {string} notes - State variable for entered notes */
    const [notes, setNotes] = useState('');

    /**
     * Handle task change.
     *
     * @param {Event} event
     */
    const handleTaskChange = (event) => {
        setTaskId(event.target.value);
    }

    /**
     * Handle hours change.
     * @param {Event} event
     */
    const handleHoursChange = (event) => {
        setHours(event.target.value);
    }

    /**
     * Handle notes change.
     *
     * @param {Event} event
     */
    const handleNotesChange = (event) => {
        setNotes(event.target.value);
    }

    return (
        <QueryClientProvider client={queryClient} contextSharing={true}>
            <div className="HarvestReportTime HarvestComponent">
                <h2 className="HarvestComponent__title">Report time</h2>
                <ul className="Properties Properties--row">
                    <li className="Properties__item">
                        <h3 className="Properties__title">Project</h3>
                        <p className="Properties__value">KI retainer</p>
                    </li>
                    <li className="Properties__item">
                        <h3 className="Properties__title">Client</h3>
                        <p className="Properties__value">KeyMan AB</p>
                    </li>
                </ul>
                <ul className="Properties Properties--row">
                    <li className="Properties__item">
                        <h3 className="Properties__title">Activity</h3>
                        <div className="Properties__input">
                            <TasksSelect onChange={ handleTaskChange} setDefaultTask={(val) => setTaskId(val)} />
                        </div>
                    </li>
                    <li className="Properties__item">
                        <h3 className="Properties__title">Hours</h3>
                        <div className="Properties__input">
                            <input type="number" className="input-field shaded-input" min="0" max="100" step="0.25" onChange={ handleHoursChange } />
                        </div>
                    </li>
                </ul>
                <ul className="Properties Properties--column">
                    <li className="Properties__item">
                        <h3 className="Properties__title">Notes</h3>
                        <div className="Properties__input">
                            <textarea className="input-field shaded-input" rows="1" placeholder="Notes (optional)" onChange={ handleNotesChange }></textarea>
                        </div>
                    </li>
                    <li className="Properties__item">
                        <div className="Properties__input">
                            <SubmitButton taskId={ taskId } hours={ hours } notes={ notes } />
                        </div>
                    </li>
                </ul>
            </div>
        </QueryClientProvider>
    );
}

/**
 * TaskSelect element.
 *
 * @param {function} onChange
 * @param {function} setDefaultTask
 * @return {JSX.Element}
 * @constructor
 */
const TasksSelect = ( { onChange, setDefaultTask } ) => {
    const context = useContext(HarvestContext);
    const { data, status, error } = useQuery('TasksSelect', async () => {
        return await api.getTasks(context.project_id);
    });

    if (status === 'loading') return ( <p className="Loading">Loading...</p> );
    if (error) return ( <p className="Error">{error.message}</p> );

    // Set the initial value for the taskId state.
    setDefaultTask(data.task_assignments[0].task.id);

    return (
        <div className="select-input select-input--micro shaded-input">
            <select className="select-input__element" onChange={ onChange } defaultValue={data.task_assignments[0].task.id}>
                { data.task_assignments.map((task) => {
                    return (
                        <option key={task.task.id} value={task.task.id}>{task.task.name}</option>
                    );
                })}
            </select>
        </div>
    );
}

/**
 * SubmitButton element.
 *
 * @param {string} taskId
 * @param {string} hours
 * @param {string} notes
 * @return {JSX.Element}
 * @constructor
 */
const SubmitButton = ({ taskId, hours, notes }) => {
    const context = useContext(HarvestContext);
    const codebase = useContext(CodebaseContext);
    let label = 'Save entry';
    let disabled = false;

    const reportTime = (event) => {
        const today = new Date().toISOString().slice(0, 10);
        const parameters = {
            project_id: parseInt(context.project_id),
            task_id: parseInt(taskId),
            spent_date: today,
            hours: parseFloat(hours),
            notes: notes,
            external_reference: {
                id: codebase.id,
                group_id: codebase.project_id,
                account_id: codebase.account_id,
                permalink: codebase.url
            }
        };

        label = 'Saving...';
        disabled = true;
        api.addTimeEntry(parameters).then((data) => {
            notify({
                title: 'Time entry saved',
                text: 'Time entry saved successfully',
                tag: 'success'
            });
        }).finally(() => {
                label = 'Save entry';
                disabled = false;
            }
        );

    }

    return (
        <button onClick={ reportTime } className="btn" disabled={ disabled }>{ label }</button>
    );
}

/**
 *
 * @return {JSX.Element}
 * @constructor
 */
function TimeEntries() {
    return (
        <QueryClientProvider client={queryClient} contextSharing={true}>
            <div className="HarvestTimeEntries HarvestComponent">
                <h2 className="HarvestComponent__title">Reported today</h2>
                <TotalTime />
                <ul className="Properties Properties--column Properties--table">
                    <li className="Properties__item Properties__item--table">
                        <div className="Properties__list">
                            <span className="Properties__prop Properties__title Prop__name">User</span>
                            <span className="Properties__prop Properties__title Prop__task">Task</span>
                            <span className="Properties__prop Properties__title Prop__time">Time</span>
                        </div>
                    </li>
                    <TimeEntry />
                </ul>
            </div>
        </QueryClientProvider>
    );
}

/**
 *
 * @return {JSX.Element}
 * @constructor
 */
const TotalTime = () => {
    const context = useContext(HarvestContext);
    const { data, status, error } = useQuery('TimeEntries', async () => {
        return await api.getTimeEntries(context.client_id, context.project_id);
    });

    if (status === 'loading') return ( <p className="Loading">Loading...</p> );
    if (error) return ( <p className="Error">{error.message}</p> );

    const hours = data.time_entries.map(e => e.hours).reduce((a, b) => a + b, 0);

    return (
        <ul className="Properties Properties--column">
            <li className="Properties__item">
                <h3 className="Properties__title">Total</h3>
                <p className="Properties__value">{ hours } hours</p>
            </li>
        </ul>
    );
}

/**
 *
 * @return {JSX.Element}
 * @constructor
 */
const TimeEntry = () => {
    const context = useContext(HarvestContext);
    const { data, status, error } = useQuery('TimeEntries', async () => {
        return await api.getTimeEntries(context.client_id, context.project_id);
    });

    if (status === 'loading') return ( <li className="Loading">Loading...</li> );
    if (error) return ( <li className="Error">{error.message}</li> );

    return (
        <>
            { data.time_entries.map((time_entry) => {
                return (
                    <li key={time_entry.id} className="Properties__item Properties__item--table">
                        <div className="Properties__list">
                            <span className="Properties__prop Prop__name">{time_entry.user.name}</span>
                            <span className="Properties__prop Prop__task">{time_entry.task.name}</span>
                            <span className="Properties__prop Prop__time">{time_entry.hours}</span>
                        </div>
                    </li>
                );
            })}
        </>
    );
}

