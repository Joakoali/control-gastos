import { useState, useEffect } from "react";
import { MONTHS } from "./constants";
import { newId, mkKey } from "./utils";
import { useAuth } from "./hooks/useAuth";
import { useHousehold } from "./hooks/useHousehold";

import LoginScreen from "./components/LoginScreen";
import HouseholdSetup from "./components/HouseholdSetup";
import SummaryCard from "./components/SummaryCard";
import VariablesTab from "./components/tabs/VariablesTab";
import FijosTab from "./components/tabs/FijosTab";
import IngresosTab from "./components/tabs/IngresosTab";
import AddModal from "./components/modals/AddModal";
import FixedModal from "./components/modals/FixedModal";
import IncomeModal from "./components/modals/IncomeModal";
import SavingsModal from "./components/modals/SavingsModal";

export default function App() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const {
    householdId,
    householdData,
    loadingHH,
    createHousehold,
    joinHousehold,
    updateMonth,
    updateFixed,
    importHistoricalData,
  } = useHousehold(user);

  const today = new Date();
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [tab, setTab] = useState("variables");
  const [loginError, setLoginError] = useState("");

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [editFixed, setEditFixed] = useState(null);
  const [addFixed, setAddFixed] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showSavings, setShowSavings] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const amt = p.get("amount"),
      name = p.get("name"),
      cat = p.get("cat");
    if (amt) {
      setEditExp({
        name: name || "",
        amount: parseFloat(amt) || 0,
        category: cat || "otros",
        _auto: true,
      });
      setShowAdd(true);
    }
  }, []);

  // ── Manejo del botón "Atrás" en Android / PWA ────────
  const anyModalOpen =
    showAdd || showIncome || showSavings || showCode || !!editFixed || addFixed;

  // Al montar la app establecemos dos entradas de historial (root + guard).
  // Así el usuario NUNCA puede salir de la PWA con el botón atrás por accidente.
  useEffect(() => {
    window.history.replaceState({ type: "app-root" }, "");
    window.history.pushState({ type: "app-guard" }, "");
  }, []);

  // Cuando se abre cualquier modal, empujamos una entrada extra.
  useEffect(() => {
    if (anyModalOpen) {
      window.history.pushState({ type: "modal" }, "");
    }
  }, [anyModalOpen]);

  // Interceptamos el popstate: si hay modal abierto lo cerramos;
  // si no hay modal, re-pusheamos el guard para que la PWA no se cierre.
  useEffect(() => {
    const onBack = () => {
      if (showAdd) {
        setShowAdd(false);
        setEditExp(null);
        return;
      }
      if (showIncome) {
        setShowIncome(false);
        return;
      }
      if (showSavings) {
        setShowSavings(false);
        return;
      }
      if (editFixed || addFixed) {
        setEditFixed(null);
        setAddFixed(false);
        return;
      }
      if (showCode) {
        setShowCode(false);
        return;
      }
      // Sin modal abierto: re-empujamos el guard para que atrás no salga de la app
      window.history.pushState({ type: "app-guard" }, "");
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [showAdd, showIncome, showSavings, editFixed, addFixed, showCode]);

  if (authLoading || loadingHH) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>💰</div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 16 }}>
          Cargando...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={async () => {
          try {
            await loginWithGoogle();
          } catch {
            setLoginError("Error al iniciar sesión. Intentá de nuevo.");
          }
        }}
        error={loginError}
      />
    );
  }

  if (!householdId) {
    return (
      <HouseholdSetup
        user={user}
        onCreate={createHousehold}
        onJoin={joinHousehold}
      />
    );
  }

  const key = mkKey(curYear, curMonth);
  const md = householdData?.months?.[key] || {
    incomeSources: [],
    savings: 0,
    expenses: [],
  };

  // Ingresos del mes anterior (para el botón "Copiar del mes anterior")
  const prevMonthKey =
    curMonth === 0 ? mkKey(curYear - 1, 11) : mkKey(curYear, curMonth - 1);
  const prevMonthSources =
    householdData?.months?.[prevMonthKey]?.incomeSources || [];
  const fixedExpenses = householdData?.fixedExpenses || [];

  const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalVar = md.expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = (md.incomeSources || []).reduce(
    (s, i) => s + i.amount,
    0,
  );
  const quedaMes = totalIncome - totalFixed - totalVar;

  const doUpdateMonth = (patch) => updateMonth(key, patch);

  const prevMonth = () => {
    if (curMonth === 0) {
      setCurMonth(11);
      setCurYear((y) => y - 1);
    } else setCurMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) {
      setCurMonth(0);
      setCurYear((y) => y + 1);
    } else setCurMonth((m) => m + 1);
  };

  const addExpense = (exp) =>
    doUpdateMonth({ expenses: [{ ...exp, id: newId() }, ...md.expenses] });
  const saveEditExp = (upd) =>
    doUpdateMonth({
      expenses: md.expenses.map((e) =>
        e.id === upd.id ? { ...e, ...upd } : e,
      ),
    });
  const delExpense = (id) =>
    doUpdateMonth({ expenses: md.expenses.filter((e) => e.id !== id) });

  const saveFixed = (exp) => {
    const idx = fixedExpenses.findIndex((e) => e.id === exp.id);
    const updated =
      idx === -1
        ? [...fixedExpenses, exp]
        : fixedExpenses.map((e) => (e.id === exp.id ? exp : e));
    updateFixed(updated);
  };
  const delFixed = (id) =>
    updateFixed(fixedExpenses.filter((e) => e.id !== id));

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <div className="header">
        <div className="header-top">
          <div className="month-nav">
            <button className="nav-btn" onClick={prevMonth}>
              ‹
            </button>
            <div className="month-title">
              {MONTHS[curMonth]} {curYear}
            </div>
            <button className="nav-btn" onClick={nextMonth}>
              ›
            </button>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              title="Ahorro"
              onClick={() => setShowSavings(true)}
            >
              🏦
            </button>
            <button
              className="icon-btn"
              title="Cuenta"
              onClick={() => setShowCode(true)}
            >
              👤
            </button>
          </div>
        </div>
        <SummaryCard
          totalIncome={totalIncome}
          totalVar={totalVar}
          totalFixed={totalFixed}
          savings={md.savings}
          quedaMes={quedaMes}
          activeTab={tab}
          onTabChange={setTab}
        />
      </div>

      <div className="content">
        {tab === "variables" && (
          <VariablesTab
            expenses={md.expenses}
            totalVar={totalVar}
            onDelete={delExpense}
            onEdit={(exp) => {
              setEditExp(exp);
              setShowAdd(true);
            }}
          />
        )}
        {tab === "fijos" && (
          <FijosTab
            fixedExpenses={fixedExpenses}
            totalFixed={totalFixed}
            onEdit={setEditFixed}
            onAdd={() => setAddFixed(true)}
          />
        )}
        {tab === "ingresos" && (
          <IngresosTab
            incomeSources={md.incomeSources || []}
            totalIncome={totalIncome}
            quedaMes={quedaMes}
            savings={md.savings}
            onEditIncome={() => setShowIncome(true)}
            onEditSavings={() => setShowSavings(true)}
          />
        )}
      </div>

      {tab === "variables" && (
        <button
          className="fab"
          onClick={() => {
            setEditExp(null);
            setShowAdd(true);
          }}
        >
          + Añadir gasto
        </button>
      )}
      {tab === "fijos" && (
        <button className="fab" onClick={() => setAddFixed(true)}>
          + Añadir fijo
        </button>
      )}
      {tab === "ingresos" && (
        <button className="fab" onClick={() => setShowIncome(true)}>
          💰 Editar ingresos
        </button>
      )}

      {showAdd && (
        <AddModal
          initial={editExp}
          onClose={() => {
            setShowAdd(false);
            setEditExp(null);
          }}
          onSave={(exp) => {
            if (editExp && !editExp._auto) saveEditExp({ ...editExp, ...exp });
            else addExpense(exp);
          }}
        />
      )}
      {(editFixed || addFixed) && (
        <FixedModal
          expense={addFixed ? null : editFixed}
          onClose={() => {
            setEditFixed(null);
            setAddFixed(false);
          }}
          onSave={saveFixed}
          onDelete={delFixed}
        />
      )}
      {showIncome && (
        <IncomeModal
          sources={md.incomeSources || []}
          prevSources={prevMonthSources}
          onClose={() => setShowIncome(false)}
          onSave={(src) => doUpdateMonth({ incomeSources: src })}
        />
      )}
      {showSavings && (
        <SavingsModal
          savings={md.savings}
          quedaMes={quedaMes}
          onClose={() => setShowSavings(false)}
          onSave={(s) => doUpdateMonth({ savings: s })}
        />
      )}

      {showCode && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && setShowCode(false)}
        >
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">👤 Mi cuenta</div>
            <div
              style={{
                background: "#f8fafc",
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  marginBottom: 6,
                }}
              >
                Sesión activa
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1e1b4b" }}>
                {user.displayName}
              </div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{user.email}</div>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                borderRadius: 14,
                padding: 16,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#7c3aed",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.4px",
                  marginBottom: 8,
                }}
              >
                Código de tu hogar
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#4c1d95",
                  letterSpacing: 8,
                }}
              >
                {householdId}
              </div>
              <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 6 }}>
                Compartí este código para que tu pareja pueda unirse
              </div>
            </div>
            <button
              onClick={async () => {
                setImporting(true);
                setImportMsg("");
                try {
                  const n = await importHistoricalData();
                  setImportMsg(
                    n > 0
                      ? `✅ ${n} meses importados correctamente`
                      : "✅ Los datos ya estaban cargados",
                  );
                } catch {
                  setImportMsg("❌ Error al importar. Intentá de nuevo.");
                }
                setImporting(false);
              }}
              disabled={importing}
              style={{
                width: "100%",
                padding: 15,
                border: "none",
                borderRadius: 13,
                background: "#ede9fe",
                color: "#7c3aed",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              {importing ? "Importando..." : "📂 Importar datos históricos"}
            </button>
            {importMsg && (
              <div
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  marginBottom: 12,
                  color: importMsg.startsWith("✅") ? "#059669" : "#ef4444",
                }}
              >
                {importMsg}
              </div>
            )}
            <button
              onClick={() => {
                logout();
                setShowCode(false);
              }}
              style={{
                width: "100%",
                padding: 15,
                border: "none",
                borderRadius: 13,
                background: "#fee2e2",
                color: "#ef4444",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
