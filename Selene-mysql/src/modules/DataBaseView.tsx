import { usePanelsStore } from "@/store/usePanelsStore";
import { useState, useEffect, useRef } from "react";
import {
  Panel,
  Group,
  Separator,
  usePanelRef,
} from "react-resizable-panels";

import WorkSpaceTreePanel from "./WorkSpaceTreePanel";
import { ContentTabManager } from "./ContentTabManager";
import { useConnectionStore } from "@/store/useConnectionStore";

/**
 * 数据库视图：布局数据库显示
 */
export default function DataBaseView({ tabId, dbKey, databases, allDatabases }: { tabId: string, dbKey: string | null, databases: string[], allDatabases?: string[] }) {

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
            defaultSize={300}
            collapsible
            className="border border-border rounded-md overflow-hidden"
          >
            <div className="flex flex-col h-full">
              <WorkSpaceTreePanel
                tabId={tabId}
                databases={databases}
                allDatabases={allDatabases ?? databases}
                dbKey={dbKey}
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
          <ContentTabManager dbKey={dbKey} />
        </Panel>

        {showRightPanel ? (
          <>
            <Separator
              id="resize-right"
              className="w-1 cursor-col-resize"
            />
            <Panel
              id="right"
              className="border border-border rounded-md overflow-hidden overflow-y-auto"
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
