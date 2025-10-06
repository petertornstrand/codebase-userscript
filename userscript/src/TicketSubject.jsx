import React,{useContext} from 'react';
import './styles/TicketSubject.css';
import CopyButton from './CopyButton';
import {URLContext} from './URLContext';
import { log } from './utils';

/**
 * Ticket subject element.
 *
 * @return {JSX.Element}
 * @constructor
 */
export default function TicketSubject({ title }) {
    const context = useContext(URLContext);
    log(context);
    return (
        <div className="TicketSubject">
            <h2 id="ticket-subject"><span className="TicketId">#{context.id}</span> {title}</h2>
            <CopyButton title="Copy ticket link" elementId="#ticket-subject" />
            <div className="TicketId__actions">
                <a className="btn" href={'/projects/' + context.project_id + '/tickets/new' }>New ticket</a>
                <a className="btn" href={'/projects/' + context.project_id + '/tickets' }>Back to list</a>
            </div>
        </div>
    );
}