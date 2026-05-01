import { useState } from "react";
import { User } from "firebase/auth";

interface Props {
  user: User;
  onCreate: () => Promise<void>;
  onJoin: (code: string) => Promise<void>;
}

export default function HouseholdSetup({ user, onCreate, onJoin }: Props) {
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      await onCreate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (code.trim().length < 6) {
      setError("Ingresá el código de 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onJoin(code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const card = "bg-white/12 rounded-[20px] p-6";
  const btnPrimary =
    "w-full py-[15px] rounded-[14px] text-[16px] font-bold cursor-pointer border-none bg-white text-indigo-700 disabled:opacity-60";
  const btnGhost =
    "w-full py-[15px] rounded-[14px] text-[16px] font-bold cursor-pointer bg-transparent border-2 border-white/60 text-white/80 mt-[10px]";
  const btnGhostFirst =
    "w-full py-[15px] rounded-[14px] text-[16px] font-bold cursor-pointer bg-transparent border-2 border-white/60 text-white/80";

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 to-violet-600 px-6 pt-15 flex flex-col">
      <div className="text-[48px] mb-2">👋</div>
      <h1 className="text-white text-[24px] font-extrabold mb-1.5">
        Hola, {user.displayName?.split(" ")[0]}
      </h1>
      <p className="text-white/75 text-[15px] mb-10">
        Para sincronizar los gastos, necesitás crear un hogar o unirte al de tu
        pareja.
      </p>

      {!mode && (
        <div className="flex flex-col gap-3.5">
          <button className={btnPrimary} onClick={() => setMode("create")}>
            🏠 Crear hogar nuevo
          </button>
          <button className={btnGhostFirst} onClick={() => setMode("join")}>
            🔗 Unirme con código
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className={card}>
          <h2 className="text-white text-[18px] font-bold mb-2.5">
            Crear hogar nuevo
          </h2>
          <p className="text-white/75 text-[14px] mb-6 leading-relaxed">
            Se va a generar un código de 6 caracteres. Compartíselo a tu pareja
            para que pueda unirse.
          </p>
          <button
            className={btnPrimary}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creando..." : "✅ Crear hogar"}
          </button>
          <button className={btnGhost} onClick={() => setMode(null)}>
            Volver
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className={card}>
          <h2 className="text-white text-[18px] font-bold mb-2.5">
            Unirme a un hogar
          </h2>
          <p className="text-white/75 text-[14px] mb-4">
            Pedile el código de 6 caracteres a quien ya creó el hogar.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: AB12CD"
            maxLength={6}
            className="w-full py-3.5 px-4 rounded-[14px] border-2 border-white/30 bg-white/15 text-white text-[22px] font-extrabold tracking-[6px] text-center outline-none mb-4 placeholder:text-white/40"
          />
          <button
            className={btnPrimary}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? "Uniéndome..." : "🔗 Unirme"}
          </button>
          <button className={btnGhost} onClick={() => setMode(null)}>
            Volver
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-300 mt-4 text-[14px] text-center">{error}</p>
      )}
    </div>
  );
}
