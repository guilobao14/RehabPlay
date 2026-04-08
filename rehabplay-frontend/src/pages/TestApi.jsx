import { useState } from "react";
import { apiFetch } from "../api/client";

export default function TestApi() {
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  async function test(path) {
    try {
      setErr("");
      setOut("A pedir... " + path);
      const data = await apiFetch(path);
      setOut(JSON.stringify(data, null, 2));
    } catch (e) {
      setErr(String(e.message || e));
      setOut("");
    }
  }

  return (
    <div className="container">
      <h1 className="pageTitle">Test API</h1>
      <p className="pageSub">Testes rápidos com sessão (cookies).</p>

      <div className="card">
        <div className="cardHeader">
          <div className="cardTitle">Requests</div>
          <span className="badge">GET</span>
        </div>

        <div className="btnRow">
          <button className="btn" onClick={() => test("/api/plan/active/")}>Plano ativo</button>
          <button className="btn" onClick={() => test("/api/notifications/")}>Notificações</button>
          <button className="btn" onClick={() => test("/api/me/gamification/")}>Gamificação</button>
          <button className="btn" onClick={() => test("/api/library/")}>Biblioteca</button>
        </div>

        {err ? <p className="errorText">{err}</p> : null}
        {out ? <pre className="codeBlock">{out}</pre> : null}
      </div>
    </div>
  );
}