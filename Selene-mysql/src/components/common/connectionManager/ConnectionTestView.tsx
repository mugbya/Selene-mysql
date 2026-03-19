import { testConnection } from "@/db/msyql-client";
import { DBConnectionPersisted } from "@/types";

import { useState } from "react";

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
      {status === "loading" && <span className="text-gray-400">测试中...</span>}
      {status === "success" && <span className="text-green-600">✓ 成功</span>}
      {status === "error" && <span className="text-red-600">✗ 失败</span>}
      <button
        onClick={() => handleTestConnect(conn, setStatus)}
        className="bg-blue-500 px-2 py-1 text-white rounded text-sm"
      >
        测试连接
      </button>
    </>
  );
};

export default ConnectionTestView;
