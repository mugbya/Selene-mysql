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

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Zap className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "hover:bg-green-100";
      case "error":
        return "hover:bg-red-100";
      default:
        return "hover:bg-blue-100";
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleTestConnect(conn, setStatus);
      }}
      className={`p-0.5 rounded cursor-pointer ${getStatusColor()}`}
      title="测试连接"
    >
      {getStatusIcon()}
    </div>
  );
};

export default ConnectionTestView;
