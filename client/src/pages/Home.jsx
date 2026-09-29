import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to FFMS</h1>

        <h2>Feature Flag Management System</h2>

        <p>
          Control features. Manage rollouts. Release with confidence.
        </p>

        <div className="buttons">
          <button onClick={() => navigate("/login")}>
            Login
          </button>

          <button onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;