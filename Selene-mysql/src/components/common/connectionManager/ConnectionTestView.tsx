import { testConnection } from "@/db/msyql-client";
import { DBConnectionPersisted } from "@/types";
import { useState } from "react";
import { Zap, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  conn: DBConnectionPersisted;
}

const ConnectionTestView = ({ conn }: Props) => {
  // 连接测试返回状态
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleTestConnect = async (
    conn: DBConnectionPersisted,
    setConnStatus: (status: "idle" | "loading" | "success" | "error") => void
  ) => {
    try {
      setConnStatus("loading");
      const result = await testConnection(conn);
      console.log("[连接测试] 返回的数据库连接:", result);

      if (result.success) {
        setConnStatus("success");
      } else {
        setConnStatus("error");
      }
    } catch (err) {
      console.error("连接失败:", err);
      setConnStatus("error");
    }
  };

  return (
    <>
      <button
        onClick={() => handleTestConnect(conn, setStatus)}
        className="p-1 hover:bg-blue-100 rounded text-blue-600"
        title="测试连接"
      >
        {status === "loading" && <Loader2 className="w-3 h-3 animate-spin" />}
        {status === "success" && <CheckCircle className="w-3 h-3" />}
        {status === "error" && <XCircle className="w-3 h-3" />}
        {status === "idle" && <Zap className="w-3 h-3" />}
      </button>
    </>
  );
};

export default ConnectionTestView;
