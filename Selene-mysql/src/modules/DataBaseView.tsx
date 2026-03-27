import { usePanelsStore } from "@/store/usePanelsStore";
import { useState, useEffect } from "react";
import {
  Panel,
  Group,
  Separator,
  usePanelRef,
} from "react-resizable-panels";

import WorkSpaceTreePanel from "./WorkSpaceTreePanel";
import { EditableResultTable } from "./ExecResultTable";
import { ExecResult } from "@/types";
import { ContentTabManager } from "./ContentTabManager";
import { useConnectionStore } from "@/store/useConnectionStore";

export default function DataBaseView({ tabId, dbKey, databases }: { tabId: string, dbKey: string | null, databases: string[] }) {

  const [execResult, setExecResult] = useState<ExecResult | null>(null);

  const showRightPanel = usePanelsStore((s) => s.showRightPanel);

  const leftPanelRef = usePanelRef();

  // 监听内容标签页变化，没有活动标签时清除结果
  const contentTabs = useConnectionStore((s) => s.contentTabs);
  const activeContentId = useConnectionStore((s) => s.activeContentId);

  useEffect(() => {
    // 如果没有活动的内容标签页，清除结果
    if (!activeContentId || contentTabs.length === 0) {
      setExecResult(null);
    }
  }, [activeContentId, contentTabs]);

  return (
    <>
      <Group id="panelGroup" orientation="horizontal" className="flex-1">
        <>
          <Panel
            id="left"
            panelRef={leftPanelRef}
            minSize={125}
            defaultSize={300}
            collapsible
            className="border border-zinc-300 rounded-md overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <WorkSpaceTreePanel
                tabId={tabId}
                databases = {databases}
                dbKey = {dbKey}
              />
            </div>
          </Panel>
          <Separator
            id="resize-left"
            className="w-1 cursor-col-resize"
          />
        </>

        <Panel
          id="main"
          minSize={30}
        >
          <Group orientation="vertical" className="h-full">
            <Panel defaultSize={execResult?.isDDL ? 92 : 70} minSize={20}>
              <ContentTabManager dbKey={dbKey} onExecResult={setExecResult} />
            </Panel>

            {execResult && (
              <>
                <Separator className="h-1 cursor-row-resize"/>

                <Panel
                  defaultSize={execResult?.isDDL ? (execResult.success ? 8 : 25) : 30}
                  minSize={execResult?.isDDL ? 1 : 10}
                >
                  <div className="h-full overflow-auto border rounded border-gray-300">
                    <EditableResultTable result={execResult} onClose={() => setExecResult(null)}/>
                  </div>
                </Panel>
              </>
            )}
          </Group>
        </Panel>

        {showRightPanel ? (
          <>
            <Separator
              id="resize-right"
              className="w-1 cursor-col-resize"
            />
            <Panel
              id="right"
              className="border border-zinc-300 rounded-md overflow-hidden overflow-y-auto"
              minSize={10}
              defaultSize={25}
              collapsible
            >
              <div className=" h-full overflow-hidden">
              </div>
            </Panel>
          </>
        ) : null}
      </Group>
    </>
  );
}
