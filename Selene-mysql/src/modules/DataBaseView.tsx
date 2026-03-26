import { usePanelsStore } from "@/store/usePanelsStore";
import { useState } from "react";
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

export default function DataBaseView({ tabId, dbKey, databases }: { tabId: string, dbKey: string | null, databases: string[] }) {

  const [execResult, setExecResult] = useState<ExecResult | null>(null);

  const showRightPanel = usePanelsStore((s) => s.showRightPanel);

  const leftPanelRef = usePanelRef();

  return (
    <>
      <Group id="panelGroup" orientation="horizontal" className="flex-1">
        <>
          <Panel
            id="left"
            panelRef={leftPanelRef}
            minSize={125}
            defaultSize={230}
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
            <Panel defaultSize={70} minSize={20}>
              <ContentTabManager dbKey={dbKey} onExecResult={setExecResult} />
            </Panel>

            {execResult && !execResult.isModify && (
              <>
                <Separator className="h-1 cursor-row-resize"/>

                <Panel defaultSize={30} minSize={10}>
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
