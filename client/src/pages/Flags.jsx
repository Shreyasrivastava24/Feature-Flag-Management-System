import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "./Flags.css";

function Flags() {
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState("");
  const [editingFlag, setEditingFlag] = useState(null);
  const [clientAppName, setClientAppName] = useState("");

  const [formData, setFormData] = useState({
    key: "",
    description: "",
    is_enabled: false,
    rollout_percentage: 0,
  });

  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const isAdmin = user?.role === "admin";

  // Fetch flags when page loads
  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      const res = await api.get("/flags");
      setFlags(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Failed to load flags"
      );
    }
  };

  const handleCreateClientApp = async (e) => {
  e.preventDefault();

  try {
    const res = await api.post("/client-apps", {
      name: clientAppName,
    });

    console.log("Client app created:", res.data);

    setClientAppName("");
  } catch (err) {
    console.error(err);
  }
};
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Create or update flag
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (editingFlag) {
        await api.put(`/flags/${editingFlag.id}`, {
          description: formData.description,
          is_enabled: formData.is_enabled,
          rollout_percentage: Number(
            formData.rollout_percentage
          ),
        });
      } else {
        await api.post("/flags", {
          ...formData,
          rollout_percentage: Number(
            formData.rollout_percentage
          ),
        });
      }

      resetForm();
      fetchFlags();

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Operation failed"
      );
    }
  };

  // Fill form when Edit button is clicked
  const handleEdit = (flag) => {
    setEditingFlag(flag);

    setFormData({
      key: flag.key,
      description: flag.description,
      is_enabled: flag.is_enabled,
      rollout_percentage: flag.rollout_percentage,
    });

    // Scroll to top so user can see the form
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete flag
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this flag?")) {
      return;
    }

    try {
      await api.delete(`/flags/${id}`);
      fetchFlags();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Delete failed"
      );
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingFlag(null);

    setFormData({
      key: "",
      description: "",
      is_enabled: false,
      rollout_percentage: 0,
    });
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="flags-page">
      <div className="flags-container">

        {/* HEADER */}
        <header className="flags-header">

          <div className="logo-section">
            <div className="logo-icon">⚡</div>

            <div>
              <h2>FeatureFlow</h2>
              <span>Feature Flag Management</span>
            </div>
          </div>

          <div className="header-actions">
            <nav className="dashboard-nav">
  <Link to="/flags">Flags</Link>
  <Link to="/audit-logs">Audit Logs</Link>
</nav>
            <div className="user-info">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <span>{user?.name || "User"}</span>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        </header>

        {/* PAGE TITLE */}
        <section className="dashboard-intro">

          <div>
            <p className="section-tag">
              FEATURE MANAGEMENT
            </p>

            <h1>Feature Flags</h1>

            <p>
              Create and manage your application's features
              from one place.
            </p>
          </div>

          <div className="stats-box">
            <span>Total Flags</span>
            <strong>{flags.length}</strong>
          </div>

        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {/* CREATE CLIENT APP */}
{isAdmin && (
  <section className="flag-form-card">
    <div className="form-heading">
      <div>
        <h3>Create Client App</h3>
        <p>Register an application and generate an API key.</p>
      </div>
    </div>

    <form onSubmit={handleCreateClientApp}>
      <div className="form-group">
        <label>Project Name</label>

        <input
          type="text"
          placeholder="e.g. Savory Bites"
          value={clientAppName}
          onChange={(e) => setClientAppName(e.target.value)}
          required
        />
      </div>

      <button className="submit-btn" type="submit">
        + Create Client App
      </button>
    </form>
  </section>
)}
        {/* CREATE / EDIT FLAG FORM */}
        {isAdmin && (
          <section className="flag-form-card">

            <div className="form-heading">

              <div>
                <h3>
                  {editingFlag
                    ? "Edit Feature Flag"
                    : "Create Feature Flag"}
                </h3>

                <p>
                  {editingFlag
                    ? `Updating: ${editingFlag.key}`
                    : "Create a new feature flag and control its rollout."}
                </p>
              </div>

              {editingFlag && (
                <button
                  className="cancel-btn"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel Editing
                </button>
              )}

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                {/* KEY */}
                {!editingFlag && (
                  <div className="form-group">
                    <label>Feature Key</label>

                    <input
                      type="text"
                      name="key"
                      placeholder="e.g. dark_mode"
                      value={formData.key}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}

                {/* DESCRIPTION */}
                <div className="form-group">
                  <label>Description</label>

                  <input
                    type="text"
                    name="description"
                    placeholder="Describe this feature..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* ROLLOUT */}
                <div className="form-group">
                  <label>
                    Rollout Percentage
                  </label>

                  <div className="rollout-input">

                    <input
                      type="number"
                      name="rollout_percentage"
                      min="0"
                      max="100"
                      value={formData.rollout_percentage}
                      onChange={handleChange}
                    />

                    <span>%</span>

                  </div>
                </div>

                {/* STATUS */}
                <div className="toggle-group">

                  <label>Feature Status</label>

                  <div className="status-toggle">

                    <span>
                      {formData.is_enabled
                        ? "Enabled"
                        : "Disabled"}
                    </span>

                    <label className="switch">

                      <input
                        type="checkbox"
                        name="is_enabled"
                        checked={formData.is_enabled}
                        onChange={handleChange}
                      />

                      <span className="slider"></span>

                    </label>

                  </div>

                </div>

              </div>

              <button
                className="submit-btn"
                type="submit"
              >
                {editingFlag
                  ? "Update Feature Flag"
                  : "+ Create Feature Flag"}
              </button>

            </form>

          </section>
        )}

        {/* FEATURE FLAGS LIST */}
        <section className="flags-list">

          <div className="list-header">

            <div>
              <h3>Your Feature Flags</h3>

              <p>
                {flags.length} feature
                {flags.length !== 1 ? "s" : ""} available
              </p>
            </div>

          </div>

          <div className="flags-table-card">

            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Status</th>
                    <th>Rollout</th>

                    {isAdmin && (
                      <th>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>

                  {flags.length > 0 ? (

                    flags.map((flag) => (

                      <tr key={flag.id}>

                        {/* FEATURE */}
                        <td>

                          <div className="feature-info">

                            <div className="feature-icon">
                              ⚡
                            </div>

                            <div>

                              <strong>
                                {flag.key}
                              </strong>

                              <p>
                                {flag.description ||
                                  "No description provided"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* STATUS */}
                        <td>

                          <span
                            className={
                              flag.is_enabled
                                ? "status enabled"
                                : "status disabled"
                            }
                          >

                            <span className="status-dot"></span>

                            {flag.is_enabled
                              ? "Enabled"
                              : "Disabled"}

                          </span>

                        </td>

                        {/* ROLLOUT */}
                        <td>

                          <div className="rollout-display">

                            <div className="progress-bar">

                              <div
                                className="progress-fill"
                                style={{
                                  width: `${flag.rollout_percentage}%`,
                                }}
                              ></div>

                            </div>

                            <span>
                              {flag.rollout_percentage}%
                            </span>

                          </div>

                        </td>

                        {/* ADMIN ACTIONS */}
                        {isAdmin && (

                          <td>

                            <div className="action-buttons">

                              <button
                                className="edit-btn"
                                onClick={() =>
                                  handleEdit(flag)
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  handleDelete(flag.id)
                                }
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        )}

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan={isAdmin ? 4 : 3}
                      >

                        <div className="empty-flags">

                          <span>🚩</span>

                          <h3>
                            No feature flags yet
                          </h3>

                          <p>
                            {isAdmin
                              ? "Create your first feature flag above."
                              : "There are currently no feature flags available."}
                          </p>

                        </div>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>

        {/* AUDIT LOG BUTTON - AFTER FLAG LIST */}
        {isAdmin && (

          <div className="audit-navigation">

            <Link
              to="/audit-logs"
              className="view-audit-btn"
            >
              📜 View Audit Logs →
            </Link>

          </div>

        )}

      </div>
    </div>
  );
}

export default Flags;