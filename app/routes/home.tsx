import { Link } from "react-router";

export default function Home() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Bienvenido</h1>
      <p>Esta es la página de inicio</p>
      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
        }}
      >
        <Link
          to="/signin"
          style={{
            padding: "0.5rem 1rem",
            background: "#007bff",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Iniciar Sesión
        </Link>
        <Link
          to="/signup"
          style={{
            padding: "0.5rem 1rem",
            background: "#28a745",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}
