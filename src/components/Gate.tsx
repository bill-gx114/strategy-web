"use client";

import { FormEvent, useState } from "react";

export function Gate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });

    setLoading(false);

    if (!response.ok) {
      setError("邀请码不正确，请检查后再试。");
      return;
    }

    window.location.reload();
  }

  return (
    <main className="gate">
      <section className="gate-card">
        <div className="gate-left">
          <div className="brand-mark">档</div>
          <h1>大厂策略产品<br />搬砖狗档案馆</h1>
          <p>这里是小红书店铺配套资料库。输入购买后收到的邀请码，即可浏览和下载对应资料。</p>
        </div>
        <form className="gate-right" onSubmit={submit}>
          <label htmlFor="inviteCode">Invitation Code</label>
          <input
            id="inviteCode"
            autoComplete="off"
            value={code}
            onChange={event => setCode(event.target.value)}
            placeholder="请输入邀请码"
          />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "验证中..." : "进入档案馆"}
          </button>
          <div className="gate-hint">如果你已经完成购买，请使用收到的邀请码访问。</div>
          {error ? <div className="gate-error">{error}</div> : null}
        </form>
      </section>
    </main>
  );
}
