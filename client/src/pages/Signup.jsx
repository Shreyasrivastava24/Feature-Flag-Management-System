import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "./Auth.css";

function Signup() {
 const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  role: "user",
});

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/auth/signup", formData);

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.error || "Signup failed"
      );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <span>FeatureFlow</span>
        </div>

        <div className="auth-heading">
          <p className="auth-tag">GET STARTED</p>

          <h1>Create your account</h1>

          <p>
            Start managing your application's
            feature flags with FeatureFlow.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="auth-group">
            <label>Full Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-group">
            <label>Email Address</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
           <div className="auth-group">
  <label>Role</label>

  <select
    name="role"
    value={formData.role}
    onChange={handleChange}
  >
    <option value="user">User</option>
    <option value="admin">Admin</option>
  </select>
</div>
          <button
            type="submit"
            className="auth-submit-btn"
          >
            Create Account →
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?

          <Link to="/login">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;