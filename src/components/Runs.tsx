// TODO: See if we still want this.

import { Badge, ProgressBar, Table } from 'react-bootstrap';
import { Run } from '../types/tool'

interface RunProps {
  runs?: Run[]
}

export default function Runs({ runs }: RunProps) {
  const statusVariant = (status: Run['status']) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'FAILED': return 'danger';
      case 'IN PROGRESS': return 'info';
      case 'PENDING': return 'secondary';
      default: return 'light';
    }
  };

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Progress</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {runs ? runs.map((run) => {
          const progress = Math.round((run.progressCompleted / run.progressTotal) * 100);

          const actions = [
            { label: 'View', onClick: () => alert(`Viewing logs for ${run.name}`) },
            { label: 'Load Fields', onClick: () => alert(`Loading fields for ${run.name}`) },
            { label: 'Undo', onClick: () => alert(`Undo run ${run.name}`) },
          ];


          return (
            <tr key={run.id}>
              <td>{run.name}</td>
              <td>
                <Badge bg={statusVariant(run.status)}>{run.status}</Badge>
              </td>
              <td>
                <ProgressBar now={progress} />
              </td>
              <td></td>
              {/* <td>{run.date}</td> */}
              <td>
                {actions.map((action, i) => (
                  <span
                    key={i}
                    role="button"
                    className="text-primary"
                    onClick={action.onClick}
                  >
                    {i > 0 && ' | '}{action.label}
                  </span>
                ))
                }
              </td>
            </tr>
          );
        }) : <tr><td>There are no runs to display.</td></tr>}
      </tbody>
    </Table>
  );
};
