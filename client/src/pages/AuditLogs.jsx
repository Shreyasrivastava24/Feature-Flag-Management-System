import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import "./AuditLogs.css";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get("/audit-logs");
      setLogs(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to load audit logs"
      );
    }
  };

  return (
    <div className="audit-page">
      <div className="audit-container">

        <div className="audit-header">
          <div>
            <p className="page-tag">ACTIVITY HISTORY</p>
            <h1>Audit Logs</h1>
            <p className="page-description">
              Track all changes made to your feature flags.
            </p>
          </div>

          <Link to="/flags" className="back-btn">
            ← Back to Flags
          </Link>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="audit-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Changed By</th>
                  <th>Changes</th>
                </tr>
              </thead>

              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="date-cell">
                        {new Date(
                          log.created_at
                        ).toLocaleString()}
                      </td>

                      <td>
                        <span className="action-badge">
                          {log.action}
                        </span>
                      </td>

                      <td className="user-cell">
                        <div className="user-avatar">
                          {log.changed_by_name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        {log.changed_by_name}
                      </td>

                      <td>
                        <pre className="changes-box">
                          {JSON.stringify(
                            log.changes,
                            null,
                            2
                          )}
                        </pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="empty-state">
                        <span>📜</span>
                        <p>No audit logs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AuditLogs;